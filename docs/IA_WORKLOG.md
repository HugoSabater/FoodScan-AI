# 🤖 Diario de Integración de IA — FoodScan AI

> **Autor:** Hugo Sabater  
> **Proyecto:** FoodScan AI — TFG DAW  
> **Herramientas IA utilizadas:** Antigravity (Google DeepMind y Claude Sonnet 4.5 _(Thinking)_) + Gemini Web (Google)  
> **Período:** Enero – Febrero 2026

---

## Índice

0. [Metodología de "Doble IA"](#0--metodología-de-doble-ia--el-paradigma-del-tech-lead)
1. [¿Qué es este documento?](#1--qué-es-este-documento)
2. [Rol de la IA vs. Rol del Alumno](#2--rol-de-la-ia-vs-rol-del-alumno)
3. [Sesiones de trabajo documentadas](#3--sesiones-de-trabajo-documentadas)
   - [Sesión 1 — Arquitectura inicial y despliegue Docker](#sesión-1--arquitectura-inicial-y-despliegue-docker)
   - [Sesión 2 — Errores de build y correcciones Front-end](#sesión-2--errores-de-build-y-correcciones-front-end)
   - [Sesión 3 — Implementación del Dashboard de Estadísticas](#sesión-3--implementación-del-dashboard-de-estadísticas)
   - [Sesión 4 — PWA y widget de recomendaciones](#sesión-4--pwa-y-widget-de-recomendaciones)
   - [Sesión 5 — Backend caído: diagnóstico y reparación](#sesión-5--backend-caído-diagnóstico-y-reparación)
   - [Sesión 6 — Auditoría de cumplimiento contra directrices](#sesión-6--auditoría-de-cumplimiento-contra-directrices)
   - [Sesión 7 — Refinación visual y resiliencia del backend](#sesión-7--refinación-visual-y-resiliencia-del-backend)
   - [Sesión 8 — Refinamiento de interactividad y consistencia de datos](#sesión-8--refinamiento-de-interactividad-y-consistencia-de-datos)
   - [Sesión 9 — Verificación exhaustiva de pre-despliegue](#sesión-9--verificación-exhaustiva-de-pre-despliegue)
4. [Errores cometidos por la IA y cómo se resolvieron](#4--errores-cometidos-por-la-ia-y-cómo-se-resolvieron)
5. [Prompts que más funcionaron](#5--prompts-que-más-funcionaron)
6. [Reflexión final del alumno](#6--reflexión-final-del-alumno)

---

## 0 · Metodología de "Doble IA" — El paradigma del Tech Lead

Para el desarrollo de FoodScan AI no se utilizó la IA como un simple generador de código automático. Se adoptó un enfoque arquitectónico en el que **dos herramientas distintas cubrían fases de trabajo distintas**, elevando mi rol al de **Engineering Manager / Tech Lead**:

### Herramienta 1 — IA Conversacional (Estrategia y Arquitectura)
Un LLM conversacional avanzado (**Gemini Web**) sirvió para:
- Discutir la viabilidad técnica del proyecto antes de escribir una línea de código.
- Diseñar la estructura del Monorepo (frontend Angular + backend Node.js + MySQL en Docker Compose).
- Definir la arquitectura CSS (BEM estricto, sistema de variables SASS, ninguna librería de utilidades).
- Diseñar y refinar los **"Prompts Maestros"** que luego se inyectarían al IDE.
- Hacer de interlocutor técnico durante sesiones de debugging cuando el error era difícil de localizar.

### Herramienta 2 — IA Integrada en el IDE (Ejecución)
El agente **Antigravity** (Google DeepMind o Claude Sonnet 4.5 _(Thinking)_, entorno de desarrollo) recibía los Prompts Maestros y:
- Exploraba el código existente para determinar el contexto real antes de tocar nada.
- Generaba HTML, SCSS y TypeScript respetando las restricciones del proyecto (BEM, `@use`, Standalone Components).
- Hacía refactorizaciones multi-archivo con auditoría previa.
- Ejecutaba comandos (`docker-compose`, `eslint --fix`, `ng build`) y leía su salida para iterar.

### El flujo de trabajo real

```
[Alumno] Decide feature o detecta problema
    │
    ▼
[Gemini Web] Sesión de diseño → genera Prompt Maestro
    │
    ▼
[Alumno] Revisa el Prompt, lo ajusta si no encaja con el proyecto
    │
    ▼
[Antigravity IDE] Injerta el prompt + contexto del código → genera cambios
    │
    ▼
[Alumno] Audita diff, compila, prueba en navegador → acepta o rechaza
```

**Por qué este approach es más riguroso que usar una sola herramienta:** ninguna IA veía el proyecto completo. El agente del IDE tiene el código real pero no el diseño estratégico; el conversacional tiene el diseño estratégico pero no el código real. Yo era el nexo que combinaba ambas perspectivas y tomaba las decisiones finales.

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

### Sesión 7 — Refinación visual y resiliencia del backend

**Objetivo:** Mejorar la experiencia de usuario en tres áreas concretas identificadas tras probar la app en producción:

1. **Imágenes rotas en ProductCard y Quick Actions chips** — Las URLs de OpenFoodFacts a veces devuelven 404 en runtime sin que el `@if` lo detecte.
2. **Chips de Quick Scan aplastados** — En pantallas pequeñas el flexbox comprimía las imágenes circulares en elipses.
3. **Productos de tendencia irrelevantes** — Los barcodes anteriores (Nutella, Coca-Cola) no representan la dieta mediterránea del mercado objetivo español.

**Prompts Maestros introducidos:**

```
"Añade imageError = signal(false) en ProductCardComponent.ts.
En el HTML, usa (error)="imageError.set(true)" en el <img> y muestra
un <div class='c-product-card__image-fallback'> con fa-basket-shopping
cuando imageError() sea true o image_url sea null."
```

```
"En ScannerComponent añade handleImageError(product: TrendingProduct)
que asigne product.image_url = null. Llámalo con (error)='handleImageError(product)'
en el <img> del chip. El @else con fa-box ya existía y actuará de fallback."
```

**Prompts Maestros de CSS:**

```scss
/* Instrucción al IDE: dentro de .c-quick-actions__image añade: */
flex-shrink: 0;    /* Evita que el flexbox aplaste la imagen en elipse */
object-fit: cover; /* Rellena el círculo sin deformarse */
border-radius: 50%; /* Círculo perfecto */
```

**Caché + fallback a BD para getTrendingProducts:**

Una decisión clave de resiliencia diseñada en sesión conversacional e implementada por el agente IDE:
- Si el caché en RAM (TTL 1h) es válido → responde desde memoria sin tocar la red.
- Si OpenFoodFacts falla o devuelve vacío → consulta `Product.findAll()` en MySQL local.
- Resultado: la sección de Escaneo Rápido nunca queda en blanco, incluso sin internet.

**Qué hice yo:**
- Seleccioné los 5 barcodes españoles (Puleva, Gallo, Orlando, Carbonell, Calvo) verificando que existieran en OFF.
- Revisé el diff de los 5 archivos modificados antes de hacer rebuild.
- Verifiqué en el navegador que el fallback del icono se activaba forzando una URL inválida.

---

### Sesión 8 — Refinamiento de interactividad y consistencia de datos

**Objetivo:** Resolver problemas de UX/UI críticos: duplicación de productos en el historial, inconsistencia en el veredicto de salud y fallos de interactividad en gráficas.

**Puntos clave abordados:**
1. **Deduplicación reactiva**: Creación de un `uniqueHistory` (computed signal) que filtra el historial por código de barras, mostrando solo el escaneo más reciente.
2. **Fuente de verdad única (Health Score)**: Refactorización global para que `health_score >= 50` sea el único criterio para determinar si un producto es "Apto", eliminando contradicciones visuales.
3. **Fix de eventos Chart.js**: Implementación de un manejador explícito `onChartClick` vinculado al `(chartClick)` de Angular, evitando que la lógica interna de Chart.js bloquee la actualización de señales.
4. **Colores Reactivos**: Eliminación de clases CSS estáticas por clases de utilidad dinámicas (`u-text-success`/`danger`) basadas en el estado.
5. **Detector de Profile Mismatch**: Alerta inteligente en el modal que detecta si el usuario ha cambiado su dieta o alergias desde que realizó el escaneo, sugiriendo un re-análisis.

**Prompts utilizados:**
```
"Crea un nuevo computed signal que deduplique el historial (mostrando solo el más reciente por producto): uniqueHistory = computed(() => ...). En el HTML, cambia el bucle @for por uniqueHistory()."
```
```
"Muestra un aviso en el modal si el perfil actual (dieta o alergias) no coincide con el perfil usado en el momento del análisis. Compara analysis.diet y profile.diet."
```

**Resultado:** Se eliminaron los duplicados del historial y se garantizó que la interfaz sea 100% coherente con la nota de salud del producto.

---

### Sesión 9 — Verificación exhaustiva de pre-despliegue

**Objetivo:** Garantizar que el proyecto está libre de errores de lint, que los contenedores son saludables y que el API responde correctamente en todos sus niveles antes de la entrega final.

**Acciones y resultados:**
1. **Auditoría de Lint**: Se detectó y corrigió un error de `no-unused-vars` en `seed.js`. El backend pasó la validación con 0 errores.
2. **Reparación de Healthcheck**: El contenedor `frontend` estaba marcado como `unhealthy`. Se diagnosticó que `localhost` no se resolvía correctamente en Alpine. Se cambió a `127.0.0.1` en `docker-compose.yml`, logrando el estado `(healthy)`.
3. **Validación de Endpoints**: Se realizaron llamadas manuales vía `curl` desde el host y `wget` desde el interior de los contenedores para validar:
   - `/api/health`: Base de datos conectada.
   - `/api/products/trending`: Datos de escaneo rápido recuperados con éxito.
   - `/api/users/1/stats`: Cálculo de estadísticas verificado.
4. **Mejora del CI/CD Local**: Se inyectó el script de `lint` en el `package.json` del frontend para facilitar auditorías futuras.

**Veredicto:** El sistema es resiliente y los servicios están correctamente orquestados y saludables.

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

### ❌ Error 6 — Inyección accidental de lógica en componente erróneo

**Qué hizo la IA:** Durante la actualización de `ProductCardComponent`, la IA intentó inyectar la lógica de deduplicación que pertenecía exclusivamente a `HistoryComponent`.

**Por qué era un error:** Introducía una redundancia innecesaria y fallos de compilación, ya que `ProductCard` es un componente de presentación que no debe gestionar el estado global del historial.

**Cómo lo detecté:** El compilador de Angular mostró inmediatamente errores de `Property 'uniqueHistory' does not exist on type 'ProductCardComponent'`.

**Cómo lo corregí:** Revertí el cambio en el componente hijo y moví la lógica correctamente al componente padre (`HistoryComponent`), manteniendo la arquitectura de responsabilidades clara.

---

## 5 · Prompts que más funcionaron

A lo largo del proyecto aprendí que la calidad del resultado de la IA depende directamente de la precisión del prompt. Estos son los formatos que dieron mejores resultados:

### ✅ Prompt Maestro de diseño — contexto + objetivo + restricciones

Ejemplo real usado para el rediseño del dashboard de estadísticas:

```
"Contexto: Frontend Angular 17, componente StatsComponent. Problema: las KPI
cards tienen anchos distintos y los gráficos son demasiado grandes.
Objetivo: Aplicar un diseño 'Premium SaaS' usando CSS Grid
(grid-template-columns: repeat(3, 1fr)) para las cards y max-height: 300px
para los chart containers.
Restricciones:
- Usar EXCLUSIVAMENTE variables SASS del proyecto ($shadow-card, $radius-lg)
- Metodología BEM estricta (.c-stats__card, .c-stats__value)
- Sin Bootstrap, sin Tailwind, sin librerías externas
- Responsive: 1 columna en mobile (<768px)"
```

**Por qué funciona:** El nivel de detalle garantiza que el código generado respeta la identidad visual (glassmorphism, sombras suaves) y la rúbrica del TFG, evitando que la IA introduzca librerías externas o CSS en línea.

---

### ✅ System Prompt para el motor de análisis IA (Groq / Llama-3)

**Problema inicial:** Con prompts genéricos (`"¿Es este producto apto para un vegano?"`), el LLM devolvía respuestas en Markdown largas e imposibles de parsear en el frontend.

**Solución — Prompt Engineering estricto:**

```
"Actúa como nutricionista experto y analista de ingredientes.
Salida OBLIGATORIA: JSON estricto con exactamente estos campos:
{
  'is_suitable': boolean,
  'analysis_reason': string (máximo 200 caracteres),
  'custom_health_score': integer (0-100),
  'warnings': string[]
}
Se penaliza severamente:
- Uso de Markdown (##, **, etc.)
- Texto fuera del JSON
- Campos adicionales no especificados"
```

**Impacto:** El frontend Angular puede hacer `JSON.parse()` directamente sobre la respuesta sin ningún procesado adicional, eliminando una fuente habitual de errores en producción.

---

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

Usar una IA en el desarrollo de este TFG fue una experiencia muy diferente a lo que esperaba al principio. La clave no fue _usar_ IA, sino _cómo_ usarla: no como una caja negra que escupe código, sino como un equipo estructurado donde yo actuaba de **Engineering Manager**.

### Lo que la IA hizo bien
- Acelerar tareas mecánicas y repetitivas (scaffolding, CRUD básico, configuración de Docker).
- Ayudar a depurar errores cuando le di el contexto exacto del problema.
- Mantener consistencia en el estilo de código cuando le especifiqué las reglas.
- Hacer una auditoría sistemática del proyecto al final.
- Implementar patrones de resiliencia (caché + fallback a BD) que hubieran costado días de investigación en solitario.

### Lo que aprendí sobre sus limitaciones
- La IA no "conoce" tu proyecto; sólo sabe lo que le muestras. Si no le das el archivo completo, toma decisiones basadas en patrones genéricos que no encajan.
- Las "alucinaciones" son reales y frecuentes: mixins que no existen, versiones de librerías incompatibles, paths incorrectos. **Nunca se debe ejecutar el código generado sin leerlo.**
- El linter (`npm run lint`) es el segundo verificador más fiable después de la compilación. Configurarlo como paso obligatorio en el Dockerfile fue una de las mejores decisiones del proyecto.
- Ninguna IA sabe cuándo parar de cambiar cosas. Esa decisión es siempre tuya.

### Mi rol como Tech Lead

| Responsabilidad | Quién decidió |
|:---|:---:|
| Definir la arquitectura y el stack | 👨 Alumno |
| Especificar restricciones BEM / `@use` / Standalone | 👨 Alumno |
| Diseñar los Prompts Maestros | 👨 Alumno (con apoyo de IA conversacional) |
| Verificar cada diff antes de hacer rebuild | 👨 Alumno |
| Detectar alucinaciones y errores del agente | 👨 Alumno |
| Tomar decisiones cuando había varias opciones | 👨 Alumno |
| Ejecución de código repetitivo / boilerplate | 🤖 Agente IDE |
| Refactorizaciones multi-archivo | 🤖 Agente IDE (bajo supervisión) |

### Veredicto personal

El desarrollo de FoodScan AI ha demostrado que la IA Generativa es un potente **acelerador**, pero **no es un sustituto del criterio ingenieril**.

Al delegar las tareas mecánicas, pude centrar mis esfuerzos en el diseño de una arquitectura robusta, la seguridad (Helmet, rate limiting, JWT), la resiliencia del sistema (caché/fallbacks) y la experiencia de usuario (PWA, UI/UX premium). Mi labor consistió en supervisar, auditar el código contra los requisitos de la rúbrica y corregir las alucinaciones de la máquina.

Esta simbiosis **humano-IA** ha permitido alcanzar un nivel de complejidad técnica, escalabilidad y acabado profesional que hubiera sido inviable en el tiempo disponible programando de forma tradicional.

Usar vocabulario técnico como *Rate Limits*, *Fallback*, *System Prompt*, *Scaffolding* o *Standalone Components* no es adorno: es evidencia de que entiendo al 100% el código de mi propio proyecto, aunque parte de él lo haya generado una máquina bajo mi dirección.

---

*Documento generado con información real del proceso de desarrollo — FoodScan AI TFG 2026*
