# Guía de Despliegue en Producción - Capa Gratuita

Esta guía describe detalladamente los pasos para desplegar gratis el proyecto **EvidenciaADSO** en producción, utilizando:
1.  **Aiven.io** para la base de datos MySQL.
2.  **Render.com** para el servidor Backend (Node.js/Express).
3.  **Netlify** para el cliente Frontend (React/Vite).

---

## Paso 1: Despliegue de la Base de Datos (MySQL en Aiven)

Para que el backend funcione en la nube, necesitamos que la base de datos sea accesible públicamente por internet de forma segura.

1.  Regístrate en [Aiven.io](https://aiven.io/) (no requiere tarjeta de crédito).
2.  Crea un nuevo servicio haciendo clic en **Create Service**.
3.  Elige **MySQL** como tipo de base de datos.
4.  Selecciona el plan **Free** (Gratuito). Elige una región cercana (ej. `us-east-1` en AWS o GCP).
5.  Asígnale un nombre a tu servicio y haz clic en **Create Service**.
6.  Una vez que el servicio cambie a estado **Running** (puede tomar unos 5 minutos), copia los siguientes datos de conexión que aparecen en la pestaña **Overview**:
    *   **Host**: Dirección del host (ej. `mysql-xxxx-xxxx.aivencloud.com`)
    *   **Port**: Puerto (normalmente un número alto como `10385`, diferente del `3306` estándar)
    *   **User**: Usuario de la base de datos (generalmente `avnadmin`)
    *   **Password**: La contraseña generada
    *   **Database**: Crea o usa la base de datos por defecto (o añade una nueva llamada `proyecto_adso_evidencias` en la pestaña *Databases* de Aiven).

### Cargar las tablas iniciales
Puedes conectarte a tu base de datos de Aiven usando DBeaver, MySQL Workbench o desde la terminal de tu máquina para cargar la estructura y los datos semilla del archivo `backend/db/schema.sql`.

---

## Paso 2: Despliegue del Backend (Render)

**Render** ofrece un plan gratuito excelente para alojar servidores web en Node.js.

1.  Crea una cuenta en [Render.com](https://render.com) e inicia sesión vinculándola con tu cuenta de GitHub (`dorlanpabon`).
2.  Haz clic en **New +** y selecciona **Web Service**.
3.  Selecciona tu repositorio de GitHub: `proyecto_adso_3118315_1`.
4.  Configura el servicio con los siguientes datos:
    *   **Name**: `evidencia-adso-backend` (o el nombre que prefieras)
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node ./bin/www`
    *   **Instance Type**: `Free`
5.  Desplázate hacia abajo y haz clic en el botón **Advanced**, luego en **Add Environment Variable**. Añade las siguientes variables de entorno:
    *   `JWT_SECRET`: (Escribe una clave secreta muy larga, ej: `mi_super_secreto_para_produccion_2026`)
    *   `DB_HOST`: (El host de tu base de datos copiado de Aiven)
    *   `DB_PORT`: (El puerto de tu base de datos copiado de Aiven)
    *   `DB_USER`: (El usuario de tu base de datos, ej: `avnadmin`)
    *   `DB_PASSWORD`: (La contraseña copiada de Aiven)
    *   `DB_NAME`: (El nombre de tu base de datos, ej: `defaultdb` o `proyecto_adso_evidencias`)
6.  Haz clic en **Create Web Service**.
7.  Render comenzará a descargar y construir tu servidor backend. Una vez completado, verás el mensaje `Listening on port 10000` (Render asigna este puerto por defecto).
8.  Copia la URL pública que te asigna Render en la parte superior de la página, por ejemplo: `https://evidencia-adso-backend.onrender.com`.

*Nota: La capa gratuita de Render entra en modo "hibernación" tras 15 minutos sin recibir tráfico. La primera petición tras este periodo puede tardar unos 50 segundos en responder mientras el contenedor se levanta.*

---

## Paso 3: Despliegue del Frontend (Netlify)

Antes de subir el frontend a producción, debemos ajustar las URLs para que ya no apunten a `localhost:4000` y apunten a la URL de producción del backend en Render.

### Práctica recomendada: Cambiar la URL del API
Abre los archivos del frontend y cambia las llamadas `fetch` para que apunten a la URL de Render copiada en el paso anterior:
*   [Login.jsx](file:///d:/xampp/htdocs/proyecto_adso_3118315_1/frontend/src/pages/Login.jsx): cambia `http://localhost:4000/api/login` por `https://tu-backend-render.onrender.com/api/login`.
*   [Register.jsx](file:///d:/xampp/htdocs/proyecto_adso_3118315_1/frontend/src/pages/Register.jsx): cambia `http://localhost:4000/api/register` por `https://tu-backend-render.onrender.com/api/register`.
*   [Dashboard.jsx](file:///d:/xampp/htdocs/proyecto_adso_3118315_1/frontend/src/pages/Dashboard.jsx): cambia todas las peticiones a `http://localhost:4000/api/users` por `https://tu-backend-render.onrender.com/api/users`.

*(Guarda los cambios, haz commit y súbelos a GitHub)*.

### Configuración en Netlify:
1.  Inicia sesión en [Netlify](https://www.netlify.com/) vinculando tu cuenta de GitHub.
2.  Haz clic en **Add new site** y luego en **Import an existing project**.
3.  Selecciona tu proveedor de Git (GitHub) y busca tu repositorio: `proyecto_adso_3118315_1`.
4.  Configura las opciones del sitio:
    *   **Base directory**: `frontend`
    *   **Build command**: `npm run build`
    *   **Publish directory**: `frontend/dist`
5.  Haz clic en **Deploy Site**.
6.  ¡Listo! En unos minutos Netlify terminará el build y te entregará una URL pública para que puedas interactuar con la aplicación.
