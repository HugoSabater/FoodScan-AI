# 🤖 Diario de Integración de IA - FoodScan

> Este documento detalla cómo se utilizó la Inteligencia Artificial Generativa como "Pair Programmer" y motor de análisis durante el desarrollo del TFG.

## 1. Rol de la IA en el Desarrollo

La IA actuó como un **Arquitecto Senior**, ayudando en:

* **Scaffolding:** Generación de estructuras de carpetas profesionales (MVC en Backend, Feature-based en Frontend).
* **Debugging:** Resolución de conflictos de puertos (3000 vs 4200) y errores de conexión Sequelize.
* **Generación de Datos:** Creación de scripts de `seeding` para poblar la base de datos con productos reales y usuarios simulados.

## 2. Motor de Análisis (Feature Core)

El núcleo del proyecto utiliza **Llama-3-70b** (a través de Groq) para analizar la salubridad de los productos.

### Evolución del Prompt de Ingeniería

Para lograr resultados consistentes en formato JSON, iteramos el "System Prompt" varias veces:

* **Versión 1 (Fallida):** "Dime si esto es sano para un vegano".
    * *Problema:* Devolvía texto largo difícil de parsear.
* **Versión Final (Exitosa):**
    * "Actúa como nutricionista experto. Analiza los ingredientes contra el perfil: {perfil}."
    * "Salida obligatoria: JSON estricto { is_suitable: boolean, reason: string }."
    * "Se penaliza severamente el uso de Markdown en la respuesta."

## 3. Desafíos Resueltos con IA

| Desafío | Solución IA | Impacto |
| :--- | :--- | :--- |
| **Error 404 Gemini** | Se detectó que la API Key no tenía permisos para modelos Beta. | Migración a **Groq SDK** (Llama 3) para menor latencia y mayor estabilidad. |
| **Arquitectura CSS** | Generación de estructura BEM/SASS escalable. | Código CSS modular y mantenible sin frameworks pesados como Bootstrap. |
| **Silent Crash Angular** | Detección de bucle en `app.component.html`. | Limpieza del layout duplicado, dejando solo `<router-outlet>`. |

## 4. Conclusión

La integración de la IA ha permitido elevar el alcance del proyecto, pasando de un CRUD simple a una aplicación inteligente capaz de realizar razonamiento lógico (ingredientes vs. salud) en tiempo real.