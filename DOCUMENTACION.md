# Documentación del Proyecto: Parrillas del Gancho

Este documento proporciona una visión general de la arquitectura, funcionalidades y guía de uso para el sitio web y sistema de administración de "Parrillas del Gancho".

## 1. Descripción General

El proyecto es una aplicación web para la exhibición y gestión de cotizaciones de parrillas y productos relacionados. Consta de dos partes principales:
1.  **Sitio Público (Frontend):** Una Landing Page moderna y responsiva donde los clientes pueden ver productos, características y contactar a la empresa.
2.  **Panel de Administración (Backend/Dashboard):** Un sistema privado para gestionar productos, ver estadísticas de visitas/cotizaciones y contactar clientes.

## 2. Estructura del Proyecto

*   **`index.html`**: Página principal del sitio web público. Contiene el carrusel, catálogo de productos, sección "Sobre Nosotros" y formularios de contacto.
*   **`admin.html`**: Panel de control para el administrador. Incluye estadísticas (gráficos), gestión de inventario (CRUD de productos) y configuración.
*   **`server.js`**: Servidor Backend (Node.js + Express). Maneja la API, almacenamiento de datos en archivos JSON y envío de correos.
*   **`stats.json`**: Base de datos ligera (archivo JSON) que almacena estadísticas de visitas, cotizaciones e historial diario.
*   **`products.json`**: Base de datos ligera (archivo JSON) que almacena el inventario de productos.
*   **`config.json`**: Archivo de configuración para credenciales (contraseña de admin, credenciales de correo). *No compartir este archivo.*
*   **`/img`**: Carpeta que contiene todas las imágenes del sitio (productos, logos, fondos).

## 3. Funcionalidades Principales

### Sitio Público (`index.html`)
*   **Catálogo Dinámico:** Los productos se cargan automáticamente desde el servidor. Si se agregan productos en el admin, aparecen aquí instantáneamente.
*   **Botón de Cotización (WhatsApp):** Cada producto tiene un botón que redirige al WhatsApp de la empresa con un mensaje pre-llenado indicando el producto de interés.
*   **Formulario de Contacto:** Permite a los usuarios enviar mensajes por correo electrónico directamente desde la web.
*   **Analítica de Usuario:** El sitio rastrea visitas, clics en "Cotizar" y envíos de formularios para generar estadísticas.
*   **Diseño Responsivo:** Adaptado para funcionar perfectamente en celulares, tablets y computadoras de escritorio.

### Panel de Administración (`admin.html`)
*   **Login Seguro:** Acceso restringido mediante contraseña.
*   **Resumen General:** Tablero con indicadores clave (KPIs) como Visitas Totales, Cotizaciones, Tasa de Conversión y Leads.
*   **Gráficos Interactivos:** Visualización del rendimiento de productos y crecimiento de ventas/interacciones.
*   **Gestión de Productos:**
    *   **Agregar:** Subir nuevos productos con nombre, precio, descripción e imagen.
    *   **Editar:** Modificar detalles de productos existentes.
    *   **Eliminar:** Quitar productos del catálogo.
    *   **Etiquetas:** Asignar etiquetas como "Nuevo" o "Más Vendido".
*   **Configuración:** Cambiar contraseña de administrador y configurar preferencias de visualización.

## 4. Guía de Uso

### Instalación y Ejecución
1.  Asegúrese de tener **Node.js** instalado.
2.  Abra una terminal en la carpeta del proyecto.
3.  Instale las dependencias (solo la primera vez):
    `npm install`
4.  Inicie el servidor:
    `npm start`
5.  Acceda al sitio web en su navegador:
    *   Público: `http://localhost:3000`
    *   Admin: `http://localhost:3000/admin.html`

### Gestión de Imágenes
Las imágenes subidas desde el panel de administración se guardan automáticamente en la carpeta `/img`. Evite borrar estas imágenes manualmente para no romper los enlaces de los productos.

### Solución de Problemas Comunes
*   **No cargan los productos:** Verifique que el servidor (`npm start`) esté corriendo.
*   **No se envían correos:** Verifique que las credenciales de correo en `server.js` o `config.json` sean correctas y permitan aplicaciones menos seguras (si usa Gmail).
*   **El gráfico se ve mal en el celular:** Gire el dispositivo o recargue la página. El sistema intenta adaptarse automáticamente.

---
**Nota Técnica:** Este sistema utiliza almacenamiento en archivos locales (JSON) por simplicidad y facilidad de copia de seguridad. Para escalar a miles de productos, se recomendaría migrar a una base de datos como MongoDB o PostgreSQL.
