# EvidenciaADSO - Sistema de Calificación de Evidencias

EvidenciaADSO es una aplicación web moderna diseñada para la gestión y calificación de evidencias de aprendizaje dentro del programa de formación ADSO. Permite a los instructores calificar las evidencias enviadas por los aprendices, y a los coordinadores gestionar los usuarios y asignar instructores y aprendices a sus respectivos cursos.

---

## 🛠️ Tecnologías Utilizadas

### Backend
*   **Node.js** con **Express.js**
*   **MySQL** (Base de datos relacional)
*   **JWT (JSON Web Tokens)** para autenticación de sesiones
*   **Bcryptjs** para encriptación segura de contraseñas
*   **Dotenv** para la gestión de variables de entorno

### Frontend
*   **React 19** con **Vite**
*   **React Router v7** para la navegación y control de acceso (Route Guards)
*   **Bootstrap 5** & **Bootstrap Icons** como framework de estilos CSS
*   Diseño personalizado premium con efectos de **Glassmorphism**, gradientes y tipografías avanzadas.

---

## 📁 Estructura del Proyecto

El proyecto está organizado en una estructura mono-repo sencilla:

```
proyecto_adso_3118315_1/
├── backend/            # Servidor Express.js, rutas, conexión a DB y middlewares
│   ├── bin/            # Script de arranque del servidor (www)
│   ├── db/             # Scripts SQL de base de datos e inicializador
│   ├── middleware/     # Middlewares de seguridad (JWT y Roles)
│   └── routes/         # Controladores y endpoints de la API
├── frontend/           # Aplicación cliente React con Vite y Bootstrap
│   ├── src/
│   │   ├── components/ # Componentes reutilizables (ej. ProtectedRoute)
│   │   ├── pages/      # Páginas (Login, Register, Dashboard)
│   │   └── index.css   # Hoja de estilos globales premium
│   └── index.html      # Punto de entrada HTML
├── deployment_guide.md # Guía detallada para el despliegue en producción
└── README.md           # Documentación general del proyecto (este archivo)
```

---

## 🚀 Cómo Iniciar en Desarrollo Local

### 1. Configuración de la Base de Datos
1. Inicia tu servidor local de **MySQL** (ej. usando **XAMPP Control Panel**).
2. Asegúrate de configurar tus credenciales en el archivo `backend/.env` (si aún no tienes uno, puedes basarte en la guía o crearlo con los puertos adecuados).
3. Abre una terminal dentro de la carpeta `backend` y ejecuta el script de configuración automática:
   ```bash
   node db/init_db.js
   ```
   *Este comando creará la base de datos `proyecto_adso_evidencias`, estructurará las tablas e insertará los registros de prueba.*

### 2. Iniciar el Backend
1. Desde la carpeta `backend`, instala las dependencias e inicia el servidor de desarrollo:
   ```bash
   npm install
   npm run dev
   ```
   *El servidor backend iniciará en el puerto **4000**.*

### 3. Iniciar el Frontend
1. Desde la carpeta `frontend`, instala las dependencias e inicia el servidor de desarrollo Vite:
   ```bash
   npm install
   npm run dev
   ```
   *El frontend iniciará en el puerto **5173** (o el siguiente puerto disponible).*
2. Abre la URL en tu navegador: [http://localhost:5173](http://localhost:5173).

---

## 🔑 Usuarios Semilla para Pruebas

Puedes probar los diferentes niveles de acceso utilizando estas cuentas preconfiguradas:

| Rol | Usuario | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Coordinador** | `admin` | `admin123` | Gestión completa de usuarios (CRUD con modales) y estadísticas |
| **Instructor** | `instructor` | `instructor123` | Visualización de bienvenida (Restricción del CRUD) |
| **Aprendiz** | `aprendiz` | `aprendiz123` | Visualización de bienvenida (Restricción del CRUD) |

---

## 🌐 Despliegue en Producción
Para poner esta aplicación en producción utilizando servicios gratuitos como **Netlify** (Frontend), **Render** (Backend) y **Aiven** (Base de Datos MySQL), consulta la guía paso a paso:
👉 **[Guía de Despliegue en Producción](file:///d:/xampp/htdocs/proyecto_adso_3118315_1/deployment_guide.md)**
