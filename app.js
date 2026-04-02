// ======================
// TODO 1: pega aquí tus credenciales (NO las publiques fuera del repo de clase)
const SUPABASE_URL = "PON_AQUI_TU_SUPABASE_URL";
const SUPABASE_ANON_KEY = "PON_AQUI_TU_SUPABASE_ANON_KEY";
// ======================

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UI refs
const msg = document.getElementById("msg");
const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");
const userEmail = document.getElementById("userEmail");

const email = document.getElementById("email");
const password = document.getElementById("password");

const btnSignUp = document.getElementById("btnSignUp");
const btnSignIn = document.getElementById("btnSignIn");
const btnSignOut = document.getElementById("btnSignOut");

const formIncidencia = document.getElementById("formIncidencia");
const aula = document.getElementById("aula");
const equipo = document.getElementById("equipo");
const tipo = document.getElementById("tipo");
const descripcion = document.getElementById("descripcion");

const tbody = document.getElementById("tbodyIncidencias");

function showMsg(text, kind = "ok") {
  msg.className = `msg ${kind}`;
  msg.textContent = text;
}

function setLoggedUI(session) {
  const logged = !!session;
  authPanel.classList.toggle("hidden", logged);
  appPanel.classList.toggle("hidden", !logged);
  userEmail.textContent = session?.user?.email ?? "—";
}

async function loadSessionAndInit() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) showMsg(error.message, "err");
  setLoggedUI(data?.session);
  if (data?.session) await loadIncidencias();
}

// ---------- AUTH ----------
btnSignUp.addEventListener("click", async () => {
  try {
    const { error } = await supabaseClient.auth.signUp({
      email: email.value.trim(),
      password: password.value
    });
    if (error) throw error;
    showMsg("Registro correcto. Revisa tu correo si pide verificación.", "ok");
  } catch (e) {
    showMsg(e.message, "err");
  }
});

btnSignIn.addEventListener("click", async () => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    });
    if (error) throw error;
    setLoggedUI(data.session);
    showMsg("Sesión iniciada.", "ok");
    await loadIncidencias();
  } catch (e) {
    showMsg(e.message, "err");
  }
});

btnSignOut.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  setLoggedUI(null);
  tbody.innerHTML = "";
  showMsg("Sesión cerrada.", "ok");
});

// ---------- CRUD ----------
formIncidencia.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  try {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const uid = sessionData?.session?.user?.id;
    if (!uid) throw new Error("No hay sesión activa.");

    // TODO 2: Insert en tabla incidencias
    const payload = {
      user_id: uid,
      aula: aula.value.trim(),
      equipo: equipo.value.trim(),
      tipo: tipo.value,
      descripcion: descripcion.value.trim(),
      estado: "abierta"
    };

    const { error } = await supabaseClient
      .from("incidencias")
      .insert(payload);

    if (error) throw error;

    formIncidencia.reset();
    showMsg("Incidencia creada.", "ok");
    await loadIncidencias();
  } catch (e) {
    showMsg(e.message, "err");
  }
});

async function loadIncidencias() {
  try {
    // TODO 3: Select de MIS incidencias (RLS ya filtra por user_id)
    const { data, error } = await supabaseClient
      .from("incidencias")
      .select("id, created_at, aula, equipo, tipo, estado")
      .order("created_at", { ascending: false });

    if (error) throw error;
    renderIncidencias(data ?? []);
  } catch (e) {
    showMsg(e.message, "err");
  }
}

function renderIncidencias(rows) {
  tbody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");

    const dt = new Date(r.created_at).toLocaleString();

    tr.innerHTML = `
      <td>${dt}</td>
      <td>${escapeHtml(r.aula)}</td>
      <td>${escapeHtml(r.equipo)}</td>
      <td>${escapeHtml(r.tipo)}</td>
      <td>${escapeHtml(r.estado)}</td>
      <td>
        ${r.estado === "abierta"
          ? `<button data-id="${r.id}" class="btnCerrar">Cerrar</button>`
          : ""}
      </td>
    `;
    tbody.appendChild(tr);
  }

  // Botones cerrar
  document.querySelectorAll(".btnCerrar").forEach(btn => {
    btn.addEventListener("click", async () => {
      await cerrarIncidencia(btn.getAttribute("data-id"));
    });
  });
}

async function cerrarIncidencia(id) {
  try {
    // TODO 4: Update estado='cerrada' SOLO si es del usuario (RLS)
    const { error } = await supabaseClient
      .from("incidencias")
      .update({ estado: "cerrada" })
      .eq("id", id);

    if (error) throw error;
    showMsg("Incidencia cerrada.", "ok");
    await loadIncidencias();
  } catch (e) {
    showMsg(e.message, "err");
  }
}

// Seguridad básica contra inyección en HTML (mínima)
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Arranque
loadSessionAndInit();