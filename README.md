# Incidencias TIC (Cloud)

## Enlaces
- Repo: [Repositorio de GitHub con el código y los recursos](https://github.com/ttlaoc/incidencias-tic.git)
- GitHub Pages: [Enlace a la página del sistema](https://ttlaoc.github.io/incidencias-tic/)

## Evidencias (capturas)
<!-- Puedes añadir una imagen (captura de pantalla) del siguiente modo (sustituye "alt text" por un texto alternativo
para que tu documento gane accesibilidad. El ejemplo supone que las imágenes las guardas en la carpeta "res"): ![alt text](res/image.png) -->
<!-- En Visual Studio Code puedes previsualizar un archivo markdown pulsando con botón derecho del ratón y seleccionando "Open preview"-->
1) Tabla `incidencias` (estructura):
![Tabla incidencias](res/tabla_incidencias.png)
2) RLS activado (se puede mirar en el editor de tablas de Supabase, pregunta a tu LLM favorito):
![RLS activado](res/RLS_enabled.png)
3) Policy (SELECT/INSERT/UPDATE) (se puede mirar donde mismo, pregunta a tu LLM favorito):
![Políticas de seguridad de la tabla incidencias](res/policies.png)
4) App funcionando (crear y listar). En la captura se debe ver tu correo:
![Aplicación funcionando (crear y listar)](res/crear_listar.png)
5) App funcionando (cerrar incidencia). En la captura se debe ver tu correo:
![Aplicación funcionando (cerrar incidencia)](res/cerrar.png)

## CE.f — Procedimiento de almacenaje cloud
### Servicio cloud usado: Supabase (Postgres + Auth + RLS)
### Estructura de tabla:
    
Tabla: **`public.incidencias`**
- `id` (uuid, PK): identificador único de la incidencia.
- `created_at` (timestamp): fecha/hora de creación.
- `user_id` (uuid): identificador del usuario autenticado (propietario de la incidencia).
- `aula` (text): aula donde ocurre.
- `equipo` (text): equipo afectado (PC-03, proyector, impresora…).
- `tipo` (text): categoría (Red / Impresora / Software / Hardware / Otro).
- `descripcion` (text): descripción técnica (sin datos personales).
- `estado` (text): `abierta` o `cerrada`.
### Autenticación:
- Se usa **Supabase Auth** con email/contraseña.
- Funciones usadas desde la app:
- `signUp()` para registrar usuarios.
- `signInWithPassword()` para iniciar sesión.
- `signOut()` para cerrar sesión.
- La app muestra distintos paneles (login/app) según exista sesión (`getSession()`).
### Permisos (RLS + policies):
- La tabla `incidencias` tiene **RLS (Row Level Security) activado**.
- Se han definido políticas para el rol `authenticated`:
    - **SELECT:** solo permite leer filas donde `user_id = auth.uid()`.
    - **INSERT:** solo permite insertar filas si `user_id = auth.uid()` (evita que se creen incidencias a nombre de otro usuario).
    - **UPDATE:** solo permite actualizar filas si `user_id = auth.uid()` (evita modificar incidencias de otros usuarios).
- Resultado: cada usuario autenticado **solo puede ver y gestionar sus propias incidencias**, aunque el frontend intentara pedir más datos.
### Conexión desde la app (URL + ANON KEY, supabase-js):
- La web (HTML/JS) se conecta a Supabase con:
    - `SUPABASE_URL` (URL del proyecto)
    - `SUPABASE_ANON_KEY` (clave pública para cliente)
- Se usa la librería **`supabase-js`** (cargada por CDN).
- Operaciones realizadas:
    - **Insert**: `from("incidencias").insert(payload)`
    - **Select**: `from("incidencias").select(...).order(...)`
    - **Update**: `from("incidencias").update({estado:"cerrada"}).eq("id", id)`
- Importante: la **ANON KEY es pública**, pero la **seguridad real** depende de **RLS** en la base de datos (no del filtrado en JS).

## CE.g — Importancia del cloud (beneficios)
### Productividad:
- No hace falta instalar ni administrar un servidor ni una base de datos local.
- Se crea el proyecto y la tabla rápidamente y se conecta desde una web estática.
- Permite iterar rápido: cambios en tabla/policies se aplican al instante.
### Seguridad:
- Autenticación gestionada (Auth) sin implementar un sistema propio de usuarios.
- Control de acceso en el servidor mediante **RLS**, aplicando el principio de **mínimo privilegio**.
- Posibilidad de auditar y centralizar el almacenamiento en un servicio gestionado.
### Coste:
- Supabase ofrece un **plan gratuito** suficiente para un proyecto educativo pequeño.
- El modelo cloud suele ser “pago por uso” y escala según necesidades, evitando costes fijos de infraestructura.
### Escalabilidad y disponibilidad:
- El servicio está disponible en Internet: acceso desde cualquier lugar con credenciales.
- La base de datos gestionada permite crecer en usuarios y datos sin rediseñar la infraestructura.
- Facilita mantener un único punto de verdad (una única BBDD) para todo el centro.


## RA5 — Riesgos y medidas
### Riesgos (3)
1) **Acceso indebido a datos** si no se configuran bien permisos (por ejemplo, si no hubiera RLS, cualquiera autenticado podría ver incidencias de otros).
2) **Exposición de información sensible** si se escriben datos personales en la descripción (nombres, teléfonos, etc.) o si se comparten capturas/enlaces sin cuidado.
3) **Uso incorrecto de claves**: publicar por error claves privadas (por ejemplo, la *service role key*) o subir datos sensibles al repositorio.

### Medidas (5)

1) **RLS activado y policies “solo propietario”** (mínimo privilegio): cada usuario solo accede a sus filas.
2) **No incluir datos personales** en las incidencias (solo aula/equipo/descripcion técnica), y usar datos agregados si se hicieran informes.
3) **Gestión correcta de claves**: usar solo **ANON KEY** en frontend y **nunca** exponer la **service role key**.
4) **Buenas prácticas de acceso**: contraseñas robustas, no compartir cuentas, cerrar sesión en equipos compartidos.
5) **Control y limpieza de información compartida**: no publicar capturas con datos sensibles, y revisar qué se sube a GitHub (repositorio, issues, commits).