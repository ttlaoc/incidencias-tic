/**
 * app.js — Incidencias TIC (Supabase + GitHub Pages)
 * ---------------------------------------------------
 * Esta app es 100% frontend (HTML/CSS/JS) y usa Supabase como backend en la nube:
 * - Auth (registro/login/logout)
 * - Base de datos (tabla incidencias)
 * - Seguridad (RLS + policies en Supabase)
 *
 * Importante (RA5):
 * - La ANON KEY se usa en frontend y es "pública" por diseño, PERO:
 *   - NUNCA uses ni publiques la SERVICE ROLE KEY (esa sí es secreta).
 * - La seguridad real la aporta RLS (Row Level Security) en la base de datos.
 */

// ======================
// TODO 1: pega aquí tus credenciales (Supabase → Project Settings → API)
const SUPABASE_URL = "PON_AQUI_TU_SUPABASE_URL";
const SUPABASE_ANON_KEY = "PON_AQUI_TU_SUPABASE_ANON_KEY";
// ======================

// Creamos el cliente de Supabase (supabase-js viene cargado por CDN en index.html)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------------------------------------------
 * 1) Referencias a elementos del DOM (la interfaz HTML)
 * --------------------------------------------------- */

// Zona de mensajes (éxito/error)
const msg = document.getElementById("msg");

// Paneles (se muestran/ocultan según haya sesión)
const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");

// Texto para mostrar el email del usuario logueado
const userEmail = document.getElementById("userEmail");

// Inputs del login/registro
const email = document.getElementById("email");
const password = document.getElementById("password");

// Botones de Auth
const btnSignUp = document.getElementById("btnSignUp");
const btnSignIn = document.getElementById("btnSignIn");
const btnSignOut = document.getElementById("btnSignOut");

// Formulario para crear incidencias
const formIncidencia = document.getElementById("formIncidencia");
const aula = document.getElementById("aula");
const equipo = document.getElementById("equipo");
const tipo = document.getElementById("tipo");
const descripcion = document.getElementById("descripcion");

// Tabla donde pintamos las incidencias
const tbody = document.getElementById("tbodyIncidencias");

/* ---------------------------------------------------
 * 2) Utilidades de UI
 * --------------------------------------------------- */

/**
 * Muestra un mensaje al usuario.
 * kind = "ok" (verde) o "err" (rojo). Las clases están en style.css
 */
function showMsg(text, kind = "ok") {
  msg.className = `msg ${kind}`;
  msg.textContent = text;
}

/**
 * Cambia la UI según exista sesión:
 * - Si hay sesión: ocultamos authPanel y mostramos appPanel
 * - Si no hay sesión: lo contrario
 */
function setLoggedUI(session) {
  const logged = !!session; // convierte a booleano
  authPanel.classList.toggle("hidden", logged);
  appPanel.classList.toggle("hidden", !logged);

  // Mostramos email del usuario (si existe)
  userEmail.textContent = session?.user?.email ?? "—";
}

/**
 * Al cargar la página:
 * - Revisamos si hay sesión activa (por ejemplo, si el usuario ya se logueó antes)
 * - Si hay sesión, cargamos incidencias
 */
async function loadSessionAndInit() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) showMsg(error.message, "err");

  setLoggedUI(data?.session);

  if (data?.session) {
    await loadIncidencias();
  }
}

/* ---------------------------------------------------
 * 3) Autenticación (registro/login/logout)
 * --------------------------------------------------- */

/**
 * Registro (signUp):
 * - Crea un usuario en Supabase Auth
 * - Según configuración, puede pedir verificación por email
 */
btnSignUp.addEventListener("click", async () => {
  try {
    const { error } = await supabaseClient.auth.signUp({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) throw error;

    showMsg("Registro correcto. Revisa tu correo si pide verificación.", "ok");
  } catch (e) {
    showMsg(e.message, "err");
  }
});

/**
 * Login (signInWithPassword):
 * - Inicia sesión con email/contraseña
 * - Si funciona, mostramos panel app y cargamos incidencias
 */
btnSignIn.addEventListener("click", async () => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) throw error;

    setLoggedUI(data.session);
    showMsg("Sesión iniciada.", "ok");
    await loadIncidencias();
  } catch (e) {
    showMsg(e.message, "err");
  }
});

/**
 * Logout:
 * - Cierra sesión en Supabase
 * - Resetea UI y tabla
 */
btnSignOut.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  setLoggedUI(null);
  tbody.innerHTML = "";
  showMsg("Sesión cerrada.", "ok");
});

/* ---------------------------------------------------
 * 4) CRUD de incidencias (Create / Read / Update)
 * --------------------------------------------------- */

/**
 * CREATE: Crear incidencia (INSERT)
 * - Lee el usuario actual para rellenar user_id
 * - Inserta en la tabla "incidencias"
 *
 * IMPORTANTE:
 * - La policy de INSERT exige: user_id = auth.uid()
 * - Por eso usamos el uid de la sesión.
 */
formIncidencia.addEventListener("submit", async (ev) => {
  ev.preventDefault(); // evita recargar la página al enviar

  try {
    // Obtenemos sesión actual para saber quién está creando la incidencia
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const uid = sessionData?.session?.user?.id;

    if (!uid) throw new Error("No hay sesión activa.");

    const payload = {
      user_id: uid, // dueña de la incidencia
      aula: aula.value.trim(),
      equipo: equipo.value.trim(),
      tipo: tipo.value,
      descripcion: descripcion.value.trim(),
      estado: "abierta",
    };

    // TODO 2: INSERT en Supabase (tabla "incidencias") usando payload.
    // Debe devolver error si falla (por ejemplo, por RLS).
    // Pista: supabaseClient.from("incidencias").insert(...)
    // const { error } = ...
    // if (error) throw error;

    ////////////////////////////////// CÓDIGO GENERADO ///////////////////////////////////////////////////////
    const { error } = await supabaseClient.from("incidencias").insert(payload);
    if (error) throw error;
    ////////////////////////////////// FIN CÓDIGO GENERADO ///////////////////////////////////////////////////

    formIncidencia.reset();
    showMsg("Incidencia creada.", "ok");

    // Recargamos lista para que aparezca al instante
    await loadIncidencias();
  } catch (e) {
    showMsg(e.message, "err");
  }
});

/**
 * READ: Cargar incidencias (SELECT)
 * - Pedimos filas de la tabla "incidencias"
 *
 * IMPORTANTE:
 * - Aquí NO filtramos explícitamente por user_id.
 * - La RLS (policy SELECT) hará que cada usuario solo vea sus filas.
 * - Aun así, si quieres, podrías filtrar por user_id como extra,
 *   pero la seguridad no debe depender de eso, sino de RLS.
 */
async function loadIncidencias() {
  try {
    // TODO 3: SELECT en Supabase para traer:
    // "id, created_at, aula, equipo, tipo, estado"
    // y ordenar por created_at descendente.
    // Pista: supabaseClient.from("incidencias").select(...).order(...)
    // const { data, error } = ...
    // if (error) throw error;
    // renderIncidencias(data ?? []);    

    ////////////////////////////////// CÓDIGO GENERADO ///////////////////////////////////////////////////////

    const { data, error } = await supabaseClient
      .from("incidencias")
      .select("id, created_at, aula, equipo, tipo, estado")
      .order("created_at", { ascending: false });

    if (error) throw error;

    renderIncidencias(data ?? []);
    ////////////////////////////////// FIN CÓDIGO GENERADO ///////////////////////////////////////////////////

  } catch (e) {
    showMsg(e.message, "err");
  }
}

/**
 * Pinta incidencias en la tabla HTML.
 * - Genera filas y, si una incidencia está "abierta", muestra botón "Cerrar".
 */
function renderIncidencias(rows) {
  tbody.innerHTML = "";

  for (const r of rows) {
    const tr = document.createElement("tr");

    // Formateo simple de fecha
    const dt = new Date(r.created_at).toLocaleString();

    tr.innerHTML = `
      <td>${dt}</td>
      <td>${escapeHtml(r.aula)}</td>
      <td>${escapeHtml(r.equipo)}</td>
      <td>${escapeHtml(r.tipo)}</td>
      <td>${escapeHtml(r.estado)}</td>
      <td>
        ${
          r.estado === "abierta"
            ? `<button data-id="${r.id}" class="btnCerrar">Cerrar</button>`
            : ""
        }
      </td>
    `;

    tbody.appendChild(tr);
  }

  // Añadimos listeners a todos los botones "Cerrar"
  document.querySelectorAll(".btnCerrar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await cerrarIncidencia(id);
    });
  });
}

/**
 * UPDATE: Cerrar incidencia
 * - Cambia estado a "cerrada" para la fila con ese id
 *
 * IMPORTANTE:
 * - La policy UPDATE exige user_id = auth.uid()
 * - Si un usuario intenta cerrar una incidencia que no es suya,
 *   Supabase devolverá error (por RLS).
 */
async function cerrarIncidencia(id) {
  try {
    // TODO 4: UPDATE en Supabase:
    // cambiar estado a "cerrada" en la fila con ese id.
    // Pista: supabaseClient.from("incidencias").update(...).eq("id", id)
    // const { error } = ...
    // if (error) throw error;

    ////////////////////////////////// CÓDIGO GENERADO ///////////////////////////////////////////////////////
    const { error } = await supabaseClient
      .from("incidencias")
      .update({ estado: "cerrada" })
      .eq("id", id);

    if (error) throw error;
    ////////////////////////////////// FIN CÓDIGO GENERADO ///////////////////////////////////////////////////

    showMsg("Incidencia cerrada.", "ok");

    // Recargamos lista para que aparezcan al instante
    await loadIncidencias();
  } catch (e) {
    showMsg(e.message, "err");
  }
}

/* ---------------------------------------------------
 * 5) Seguridad mínima en el frontend
 * --------------------------------------------------- */

/**
 * Escapa HTML para evitar que, si alguien mete "<script>" en un campo,
 * se ejecute al mostrarlo en la tabla.
 * (No sustituye a la seguridad del backend, pero evita problemas en la UI)
 */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------------------------------
 * 6) Arranque de la app
 * --------------------------------------------------- */

// Opcional: si cambian eventos de auth (token renovado, logout en otra pestaña, etc.)
supabaseClient.auth.onAuthStateChange((_event, session) => {
  setLoggedUI(session);
  // Si entra sesión, recargamos. Si sale, limpiamos tabla.
  if (session) loadIncidencias();
  else tbody.innerHTML = "";
});

// Inicializamos comprobando sesión existente
loadSessionAndInit();
