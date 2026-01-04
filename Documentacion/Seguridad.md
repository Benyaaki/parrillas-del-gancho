# Reporte de Auditoría de Seguridad - Parrillas del Gancho

Fecha: 4 de Enero, 2026
Responsable: Ing. Senior de Seguridad Backend / Antigravity Agent
Estado del Proyecto: PROD-READY (Seguridad Verificada)

---

# 1. Objetivo de la Auditoría

Consolidar, reforzar y documentar todas las capas de seguridad implementadas en la aplicación "Parrillas del Gancho", asegurando protección contra vulnerabilidades comunes (OWASP Top 10) como Broken Authentication, XSS, Unrestricted File Uploads y Data Tampering.

---

# 2. Pruebas Realizadas y Medidas Implementadas

# 2.1 Autenticación y Autorización (Backend)

Vulnerabilidad Previa: El sistema dependía de validaciones frontend fáciles de evadir. Las rutas API eran públicas.
Solución Implementada: 
*   JWT (JSON Web Tokens): Se implementó autenticación robusta mediante tokens firmados con expiración de 8 horas.
*   Middleware verifyToken: Protege todas las rutas críticas (POST, PUT, DELETE).
*   Bypass Testing: Se verificó que peticiones directas vía Postman/cURL sin token retornan 401 Unauthorized.
*   Estado: APROBADO

# 2.2 Validación de Datos y Sanitización (Input)

Vulnerabilidad Previa: Posibilidad de inyectar scripts (XSS) en nombres o descripciones, y enviar precios negativos.
Solución Implementada:
*   Sanitización Automática: Todo input de texto se limpia con la librería xss antes de guardarse.
*   Validación Estricta de Precios:
    *   priceMode: 'monto' -> Requiere número positivo finito (max 10MM).
    *   priceMode: 'consultar' -> Fuerza price: null en base de datos.
    *   Rechazo automático (HTTP 400) de precios negativos o formatos inválidos.
*   Estado: APROBADO

# 2.3 Seguridad de Archivos (Uploads)

Vulnerabilidad Previa: Posibilidad de subir scripts (.js) o archivos maliciosos (.php, .svg) renombrados.
Solución Implementada:
*   MIME-Type Whitelist: Configuración estricta de multer que acepta EXCLUSIVAMENTE image/jpeg y image/png.
*   Sanitización de Nombres: Los archivos se renombran con timestamp + limpieza de caracteres especiales para evitar Path Traversal.
*   Manejo de Errores: El servidor devuelve mensajes claros (HTTP 400) si el formato es rechazado.
*   Estado: APROBADO

# 2.4 Rate Limiting & DoS Protection

Vulnerabilidad Previa: APIs expuestas a abuso masivo (spam de correos, fuerza bruta).
Solución Implementada:
*   Strict Limiter: /api/send-email limitado a 10 peticiones/hora por IP.
*   API Limiter: Rutas generales limitadas a 100 peticiones/15min.
*   Estado: APROBADO

# 2.5 Seguridad Cliente (Frontend)

Vulnerabilidad Previa: Almacenamiento inseguro y manejo de errores pobre.
Solución Implementada:
*   authFetch Helper: Wrapper centralizado que inyecta automáticamente el token Bearer y maneja la expiración de sesión (Logout forzado en 401/403).
*   CORS Restrictivo: Política configurada para denegar accesos desde orígenes no autorizados.
*   Mensajes Claros: UI adaptada para mostrar errores específicos del backend (ej. "Formato de archivo no permitido") en lugar de fallos genéricos.
*   Estado: APROBADO

---

# 3. Evidencias de Verificación

1.  Exploit Auth: POST /api/products (Sin Token) -> 401 Unauthorized (Bloqueado).
2.  Exploit XSS: POST /api/sales con body <script> -> Guardado como &lt;script&gt; (Sanitizado).
3.  Exploit Upload: Subida de malware.js.jpg -> 400 Bad Request (Rechazado por MIME type).
4.  Exploit Logic: Precio -5000 -> 400 Bad Request (Rechazado).

---

# 4. Recomendaciones Finales

El sistema es actualmente seguro para despliegue productivo bajo las condiciones auditadas.
*   Despliegue: Asegurar que el entorno de producción use HTTPS (SSL) para proteger el token JWT en tránsito.
*   Secretos: Mover JWT_SECRET y credenciales de correo a variables de entorno (.env) en el servidor final (actualmente hardcoded por requerimiento de entorno local).