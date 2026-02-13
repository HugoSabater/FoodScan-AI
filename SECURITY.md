# Security Policy

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Si encuentras una vulnerabilidad en FoodScan AI, por favor **no abras una Issue pública**.

**Proceso de reporte:**
1. Envía un correo a: hugocullera83@gmail.com
2. Incluye una descripción detallada del problema
3. Si es posible, adjunta pasos para reproducir la vulnerabilidad

**Tiempo de respuesta:**
- Confirmación inicial: 48 horas
- Análisis y fix: 7-14 días (según severidad)

**Agradecimientos:**
Agradecemos tu colaboración para mantener FoodScan AI seguro para todos los usuarios.

## Consideraciones de Seguridad

### Variables de Entorno
- **NUNCA** commitear archivos `.env` con credenciales reales
- Usar `.env.example` como template sin valores sensibles
- Rotar API keys si se exponen accidentalmente

### Base de Datos
- Usar contraseñas fuertes en producción
- Limitar acceso a MySQL solo desde backend
- Implementar rate limiting en endpoints públicos

### API Keys
- Groq API Key debe mantenerse en el backend
- No exponer keys en código cliente (frontend)
- Revocar keys comprometidas inmediatamente
