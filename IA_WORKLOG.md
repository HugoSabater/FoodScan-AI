# 🤖 Diario de Uso de IA — FoodScan AI

> **Autor:** Hugo Sabater  
> **Proyecto:** FoodScan AI — TFG DAW  
> **Herramienta IA utilizada:** Antigravity (Google DeepMind) — modelo basado en Gemini y Claude 3.5 Sonnet
> **Período:** Enero – Febrero 2026

---

## Índice

1. [¿Qué es este documento?](#1--qué-es-este-documento)
2. [Rol de la IA vs. Rol del Alumno](#2--rol-de-la-ia-vs-rol-del-alumno)
3. [Sesiones de trabajo documentadas](#3--sesiones-de-trabajo-documentadas)
   - [Sesión 1 — Arquitectura inicial y despliegue Docker](#sesión-1--arquitectura-inicial-y-despliegue-docker)
   - [Sesión 2 — Errores de build y correcciones Front-end](#sesión-2--errores-de-build-y-correcciones-front-end)
   - [Sesión 3 — Implementación del Dashboard de Estadísticas](#sesión-3--implementación-del-dashboard-de-estadísticas)
   - [Sesión 4 — PWA y widget de recomendaciones](#sesión-4--pwa-y-widget-de-recomendaciones)
   - [Sesión 5 — Backend caído: diagnóstico y reparación](#sesión-5--backend-caído-diagnóstico-y-reparación)
   - [Sesión 6 — Auditoría de cumplimiento contra directrices](#sesión-6--auditoría-de-cumplimiento-contra-directrices)
4. [Errores cometidos por la IA y cómo se resolvieron](#4--errores-cometidos-por-la-ia-y-cómo-se-resolvieron)
5. [Prompts que más funcionaron](#5--prompts-que-más-funcionaron)
6. [Reflexión final del alumno](#6--reflexión-final-del-alumno)

---

## 1 · ¿Qué es este documento?

Este archivo es el **diario de colaboración con Inteligencia Artificial** exigido como parte de la documentación del TFG. Su objetivo es dejar constancia de:

- **Qué** hizo la IA y qué hice yo.
- **Cómo** le pedí las cosas (los prompts usados).
- **Qué falló** y cómo lo detecté y corregí.
- **Qué aprendí** del proceso de trabajar con un agente de código.

La IA **no fue un sustituto** del trabajo de programación; fue una herramienta que aceleró partes mecánicas del proceso mientras yo tomaba todas las decisiones de diseño, arquitectura y validación.

---

## 2 · Rol de la IA vs. Rol del Alumno

| Tarea | Quién la hizo |
|---|---|
| Diseño de la arquitectura monorepo | 👨 Alumno |
| Selección del stack tecnológico (Angular 17, Node.js, Groq, MySQL) | 👨 Alumno |
| Generación de código repetitivo (controladores CRUD, servicios HTTP) | 🤖 IA |
| Corrección de errores de sintaxis en archivos existentes | 🤖 IA (detectado por mí) |
| Diseño UI/UX y metodología BEM | 👨 Alumno + revisión IA |
| Depuración del contenedor backend caído | 🤖 IA (bajo supervisión) |
| Validación de que el fix era correcto | 👨 Alumno |
| Configuración de CORS, Helmet y rate limiting | 👨 Alumno (IA ayudó a recordar parámetros) |
| Prompt engineering para Groq/Llama | 👨 Alumno + iteraciones con IA |
| Detección de scripts de debug olvidados | 🤖 IA |
| Toma de decisiones sobre qué borrar o mantener | 👨 Alumno |
| Escritura de este documento | 🤖 IA + revisión y aval del alumno |

---

## 3 · Sesiones de trabajo documentadas

---

### Sesión 1 — Arquitectura inicial y despliegue Docker

**Objetivo:** Levantar el stack completo (MySQL + Backend + Frontend) usando Docker Compose.

**Prompts utilizados:**

```
"Crea un docker-compose.yml con tres servicios: MySQL 8, 
un backend Node.js/Express y un frontend Angular con Nginx. 
El backend debe esperar a que MySQL esté healthy antes de arrancar."
```

```
"El frontend está sirviendo archivos vacíos. Revisa el COPY 
del Dockerfile y el path de salida de ng build."
```

**Qué hizo la IA:**
- Generó la estructura inicial del `docker-compose.yml` con healthchecks.
- Ayudó a detectar que el path `COPY /app/dist/frontend` era incorrecto — Angular 17 genera la salida en `/app/dist/frontend/browser`.

**Qué hice yo:**
- Revisé cada línea del `docker-compose.yml` antes de ejecutarlo.
- Verifiqué con `docker-compose ps` y `docker logs` que los contenedores arrancaban.
- Cambié el puerto del host de MySQL de 3306 a 3307 para evitar conflicto con mi instalación local.

**Resultado:** Los tres contenedores arrancaron correctamente.

---

### Sesión 2 — Errores de build y correcciones Front-end

**Objetivo:** Resolver una cadena de 9 errores que impedían compilar o servir la app.

**Errores y cómo se resolvieron:**

| Error | Descripción | Solución |
|---|---|---|
| `NG5002` | Syntax error en template Angular (`@if/@else if`) | Bloques contiguos sin línea vacía entre ellos |
| CSS Budget | Archivos `.scss` superaban el límite de 2 kB | Límite aumentado a 10 kB en `angular.json` |
| Docker COPY path | Nginx servía directorio vacío | Corregido a `/app/dist/frontend/browser` |
| MySQL user error | `DB_USER=root` en lugar del usuario creado | Cambiado a `foodscan_user` |
| Port conflicts | Puertos 3306 y 80 ocupados en el host | Remapeados a 3307 y 8080 |
| `init.sql` era directorio | Docker no podía montar el script de BD | Recreado el archivo correctamente |
| Health check fail | `localhost` resolvía a IPv6 (::1) en Alpine | Cambiado a `127.0.0.1` en el Dockerfile |

**Prompts utilizados:**

```
"El build falla con 'NG5002: Unexpected character'. 
Revisa el archivo scanner.component.html."
```

```
"docker-compose logs backend muestra que no puede conectar 
a MySQL. El error es ER_ACCESS_DENIED_ERROR para el usuario 'root'."
```

**Lección aprendida:** La IA propuso varios fixes en paralelo sin verificar el orden de dependencias. Yo tuve que priorizar cuáles testar primero (los de Docker antes que los de Angular) para no perder tiempo.

---

### Sesión 3 — Implementación del Dashboard de Estadísticas

**Objetivo:** Crear un dashboard con gráficas (Chart.js / ng2-charts) que muestre el historial de escaneos del usuario.

**Prompts utilizados:**

```
"Crea un componente Angular standalone llamado StatsComponent 
que use ng2-charts para mostrar un gráfico de donut con la 
distribución de NutriScore (a/b/c/d/e) de los últimos escaneos 
del usuario logado."
```

```
"Añade al user.controller.js una función getUserStats que 
consulte los scans del usuario, haga JOIN con la tabla products 
y devuelva: totalScans, nutriScoreDistribution y suitability."
```

**Qué generó la IA:**
- El componente `stats.component.ts` con suscripción al servicio y configuración de Chart.js.
- El endpoint `GET /api/users/:userId/stats` en el controlador.
- La ruta en `api.routes.js`.

**Qué tuve que corregir yo:**
- Los imports de RxJS (`map`) estaban escritos de forma antigua; los actualicé.
- El SCSS del componente usaba `@import` (prohibido en el proyecto) en lugar de `@use`.
- Los mixins `@include container` y `@include flex-center-y` no existían en nuestro sistema de diseño; los reemplacé por CSS directo.

---

### Sesión 4 — PWA y widget de recomendaciones

**Objetivo 1:** Convertir la app en una PWA instalable en móvil.  
**Objetivo 2:** Eliminar el widget "Tu Menú de Hoy" del sidebar.

**Problema encontrado:** `ng add @angular/pwa` fallaba porque PowerShell bloqueaba la ejecución de scripts.

**Solución aplicada con guía de la IA:**

```powershell
# Paso 1 — Instalar el paquete manualmente (sin ng add)
npm install @angular/pwa@17 --legacy-peer-deps

# Paso 2 — Invocar el schematic directamente
npm run ng -- g @angular/pwa:pwa --project foodscan-frontend
```

La IA me explicó por qué fallaba (`Set-ExecutionPolicy` en PowerShell) y propuso el workaround con `cmd /c` para ejecutar comandos de npm sin restricciones.

**Personalización del manifest:**

```json
{
  "name": "FoodScan AI",
  "short_name": "FoodScan",
  "theme_color": "#2ECC71",
  "background_color": "#ffffff"
}
```

**Widget eliminado:** La IA localizó el componente `RecommendationsWidgetComponent`, eliminó la etiqueta `<app-recommendations-widget />` del template y limpió el import en el TypeScript.

---

### Sesión 5 — Backend caído: diagnóstico y reparación

**Objetivo:** El contenedor backend no arrancaba. Diagnóstico y reparación en producción.

**Proceso de depuración:**

```
docker-compose logs backend
→ SyntaxError: missing ) after argument list
   at app.js:26
```

**Causa raíz encontrada:**

Al revisar `backend/src/app.js`, la IA detectó que había dos líneas duplicadas dentro de la llamada a `cors()`:

```diff
  app.use(
    cors({
      origin: env.cors.origin,
      credentials: env.cors.credentials,
-   })
-   credentials: env.cors.credentials,  // ← DUPLICADO
-  })                                    // ← cierre extra
  );
```

Esto producía un `SyntaxError` que impedía que Node.js cargase el módulo.

**Cómo se detectó:** La IA leyó el archivo `app.js` completo línea a línea y comparó la estructura con la sintaxis esperada de `cors()`.

**Cómo lo verifiqué yo:** Comparé la versión del archivo antes y después del fix. Ejecuté `docker-compose up -d --build backend` y confirmé el estado `(healthy)` en `docker-compose ps`.

**Verificación de endpoints tras el fix:**

```bash
curl http://localhost:3000/api/health     # {"status":"ok"}
curl http://localhost:3000/api/users     # [ lista de usuarios ]
curl http://localhost:3000/api/users/1/stats  # {"totalScans":10,...}
```

---

### Sesión 6 — Auditoría de cumplimiento contra directrices

**Objetivo:** Revisar el proyecto completo contra las directrices del profesor y corregir todas las desviaciones.

**Prompts utilizados:**

```
"Revisa todo el proyecto contra estas directrices [se pegó la lista 
completa] y dime qué cumple, qué falta y qué hay que corregir."
```

**Hallazgos y correcciones:**

| Problema | Corrección |
|---|---|
| Ruta de navegación `/scanner` no existía en el router (era `/scan`) | Corregido en `main-layout.component.ts` |
| 5 scripts de debug (`check-*.js`) olvidados en producción | Eliminados con `del` |
| `version: '3.8'` obsoleto en `docker-compose.yml` | Eliminado |
| 67 errores ESLint (CRLF en `off.service.js`, paréntesis innecesarios) | Corregidos con `eslint --fix` + fix manual |
| `RUN npm run lint` estaba comentado en el `Dockerfile` | Descomentado y activado |

**Mi rol en esta sesión:** Proporcioné la lista de directrices y supervisé cada decisión de la IA. Algunos archivos (como `off.service.js`) los revisé manualmente después del auto-fix para asegurarme de que el código tenía sentido lógico y no sólo pasaba el linter.

---

## 4 · Errores cometidos por la IA y cómo se resolvieron

Esta sección es especialmente importante. La IA **no es infalible** y cometió errores reales que tuve que detectar y corregir.

---

### ❌ Error 1 — Imports SCSS obsoletos

**Qué hizo la IA:** Generó el archivo `stats.component.scss` usando `@import` para incluir las variables y mixins del proyecto.

**Por qué era un error:** Las directrices del proyecto prohíben explícitamente `@import` (deprecated en Dart Sass). Se debe usar `@use`.

**Cómo lo detecté:** El comando `ng build` mostró una advertencia de deprecación. Al revisar el archivo generado, vi `@import '../../../styles/...'`.

**Cómo lo corregí:** Cambié todos los `@import` por `@use 'ruta' as vars`.

---

### ❌ Error 2 — Uso de mixins que no existen

**Qué hizo la IA:** En el mismo `stats.component.scss` usó `@include container` y `@include flex-center-y`.

**Por qué era un error:** Esos mixins no están definidos en nuestro sistema de diseño (`_mixins.scss`). La IA los "inventó" asumiendo que existían.

**Cómo lo detecté:** El build falló con `Error: Undefined mixin`.

**Cómo lo corregí:** Los reemplacé por propiedades CSS directas usando las variables del sistema (`vars.$spacing-lg`, etc.).

> **Reflexión:** Esto se llama "alucinación de código". La IA conoce patrones comunes de SCSS y los aplica aunque no existan en el contexto del proyecto. Siempre hay que revisar si lo que genera se corresponde con la realidad del proyecto.

---

### ❌ Error 3 — RxJS imports incorrectos

**Qué hizo la IA:** En `user.service.ts` importó el operador `map` de forma incorrecta, mezclando imports de `rxjs` y `rxjs/operators` de manera incompatible.

**Por qué era un error:** Con RxJS 7+ (que usa Angular 17), todos los operadores se importan desde `rxjs` directamente, no desde `rxjs/operators`.

**Cómo lo detecté:** TypeScript marcó el error en el editor con un subrayado rojo antes de intentar el build.

**Cómo lo corregí:** Cambié `import { map } from 'rxjs/operators'` por `import { map } from 'rxjs'`.

---

### ❌ Error 4 — Script de debug dejado en producción

**Qué hizo la IA (en una sesión anterior):** Durante la fase de diagnóstico del backend creó archivos temporales (`check-groq.js`, `check-meal-plan.js`, etc.) directamente en las carpetas del proyecto para hacer pruebas rápidas.

**Por qué era un error:** Estos scripts no tienen lugar en un proyecto de producción. Estarían incluidos en la imagen Docker, ocupando espacio y exponiendo información sobre la configuración interna.

**Cómo lo detecté:** Al hacer la auditoría final, listando el contenido de `backend/` y `backend/src/scripts/`.

**Cómo lo corregí:** Los eliminé con `del /f /q`.

---

### ❌ Error 5 — `version: '3.8'` en docker-compose

**Qué hizo la IA:** Mantuvo el campo `version: '3.8'` en el `docker-compose.yml` cuando lo generó.

**Por qué era un error:** En Docker Compose v2 (la versión actual), el campo `version` es ignorado y genera un warning: `the attribute 'version' is obsolete`. Las directrices piden un entorno limpio y sin warnings.

**Cómo lo detecté:** Al ejecutar `docker-compose up`, el warning se mostraba en la consola.

**Cómo lo corregí:** Eliminé la línea `version: '3.8'` del archivo.

---

## 5 · Prompts que más funcionaron

A lo largo del proyecto aprendí que la calidad del resultado de la IA depende directamente de la precisión del prompt. Estos son los formatos que dieron mejores resultados:

### ✅ Prompt de depuración — contexto + síntoma + archivo

```
"El contenedor backend no arranca. Este es el log de Docker:
[pegar log aquí]
Este es el archivo app.js:
[pegar código aquí]
¿Cuál es el error y cómo lo corrijo?"
```

**Por qué funciona:** La IA tiene toda la información necesaria y no necesita hacer suposiciones.

---

### ✅ Prompt de generación con restricciones

```
"Crea un componente Angular 17 standalone para mostrar estadísticas.
Restricciones:
- Usa SCSS con @use (nunca @import)
- BEM estricto: .c-stats__card, .c-stats__value
- Sin librerías externas salvo ng2-charts
- El componente debe recibir los datos vía un servicio inyectado"
```

**Por qué funciona:** Las restricciones explícitas evitan que la IA use patrones genéricos que no encajan con las directrices del proyecto.

---

### ✅ Prompt de auditoría

```
"Revisa este archivo contra estas reglas [lista de reglas].
Para cada regla: indica PASS, FAIL o N/A y explica por qué."
```

**Por qué funciona:** Obliga a la IA a ser sistemática en lugar de dar una respuesta vaga como "todo parece bien".

---

### ⚠️ Prompts que funcionaron peor

```
# Demasiado vago — la IA toma decisiones que quizás no quiero
"Mejora el backend"

# Sin contexto — la IA inventa lo que no sabe
"Arregla el error de SCSS"
```

---

## 6 · Reflexión final del alumno

Usar una IA como Antigravity en el desarrollo de este TFG fue una experiencia muy diferente a lo que esperaba al principio.

**Lo que la IA hizo bien:**
- Acelerar tareas mecánicas y repetitivas (scaffolding, CRUD básico, configuración de Docker).
- Ayudar a depurar errores cuando le di el contexto exacto del problema.
- Mantener consistencia en el estilo de código cuando le especifiqué las reglas.
- Hacer una auditoría sistemática del proyecto al final.

**Lo que aprendí sobre sus limitaciones:**
- La IA no "conoce" tu proyecto; sólo sabe lo que le muestras. Si no le das el archivo completo, toma decisiones basadas en patrones genéricos que pueden no encajar.
- Las "alucinaciones" son reales y frecuentes: mixins que no existen, versiones de librerías incompatibles, paths incorrectos. Nunca se debe ejecutar el código generado sin leerlo.
- El linter (`npm run lint`) es el segundo verificador más fiable después de la compilación. Configurarlo como paso obligatorio en el Dockerfile fue una de las mejores decisiones del proyecto.

**Mi rol fue siempre el de director del proceso:**
1. Yo definí la arquitectura y el stack.
2. Yo especifiqué las restricciones (BEM, `@use`, standalone components).
3. Yo verifiqué cada cambio antes de aplicarlo.
4. Yo detecté los errores que la IA introdujo.
5. Yo tomé las decisiones cuando había varias opciones válidas.

La IA fue una herramienta potente, pero requirió criterio técnico constante para usarla bien. Sin entender lo que se está construyendo, sería muy fácil aceptar código incorrecto, con deuda técnica o inseguro.

---

*Documento generado con información real del proceso de desarrollo — FoodScan AI TFG 2026*
