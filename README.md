# 🥗 FoodScan AI - Intelligent Nutritional Assistant

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?logo=angular)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs)
![MySQL](https://img.shields.io/badge/MySQL-8.0-00758F?logo=mysql)
![AI Powered](https://img.shields.io/badge/AI-Groq%20%2F%20Llama3-blueviolet)

**Autor:** Hugo Sabater  
**Repositorio:** https://github.com/HugoSabater/FoodScan-AI  
**Licencia:** MIT

> **FoodScan AI** no es solo un escáner de códigos de barras. Es un asistente nutricional inteligente que analiza los ingredientes de cualquier producto y determina en tiempo real si es apto para TI, basándose en tu perfil único (Alergias, Dietas: Vegano, Keto, etc.).

## 🚀 Características Principales

* **🔍 Escaneo Inteligente:** Detección de productos mediante códigos de barras (EAN-13).
* **🧠 Análisis con IA Generativa:** Uso de LLMs (Llama 3 vía Groq) para interpretar listas de ingredientes complejas.
* **👤 Perfil Dinámico:** Configura tus restricciones (ej. "Alergia a Nueces", "Dieta Keto"). La IA adapta el veredicto instantáneamente.
* **📚 Historial Persistente:** Registro de todos tus escaneos con su estado de salud original.
* **🎨 UI/UX Premium:** Interfaz moderna con metodología BEM, Glassmorphism y animaciones fluidas.

## 🛠️ Stack Tecnológico

### Backend (API REST)
* **Runtime:** Node.js + Express.js
* **Database:** MySQL con Sequelize ORM
* **AI Integration:** Groq SDK (Llama 3-70b) + OpenFoodFacts API
* **Security & Quality:** Helmet, Morgan, ESLint, Prettier.

### Frontend (SPA)
* **Framework:** Angular 17+ (Standalone Components)
* **Styling:** SCSS con Arquitectura BEM (Bloque-Elemento-Modificador).
* **State Management:** Angular Signals + LocalStorage.
* **Components:** Modal reutilizable, Chips interactivos, Grid Responsive.

## 📂 Estructura del Proyecto

```bash
FoodScan-AI/
├── src/                    # 🔧 Backend (Node.js + Express + MySQL)
│   ├── controllers/        # Lógica de negocio (users, products, scans)
│   ├── services/           # IA (Groq) + OpenFoodFacts integration
│   ├── models/             # Sequelize ORM models
│   ├── routes/             # Express routes
│   ├── middlewares/        # Error handling, validation
│   ├── scripts/            # Seeds y utilidades
│   └── config/             # Database & environment config
│
├── foodscan-frontend/      # 🎨 Frontend (Angular 17)
│   ├── src/app/features/   # Scanner, History, Profile
│   ├── src/app/shared/     # Componentes reutilizables (ProductCard, Modal)
│   ├── src/styles/         # SCSS con BEM (utilities, components, layout)
│   └── src/assets/         # Imágenes, iconos
│
├── package.json            # Backend dependencies
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── README.md               # Este archivo
└── IA_WORKLOG.md           # Diario de desarrollo con IA
```

## 📦 Instalación y Despliegue

### Prerrequisitos
* Node.js v18+
* MySQL Server corriendo en puerto 3306

### 1. Configurar Backend

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales (DB, Groq API Key)

# Poblar base de datos con datos de prueba
npm run seed

# Iniciar servidor de desarrollo
npm run dev   # Corre en puerto 3000
```

### 2. Configurar Frontend

```bash
cd foodscan-frontend
npm install
npm start   # Corre en puerto 4200
```

## 🧪 Pruebas de Concepto (Demo)

### Caso Vegano:
* Ve a Perfil, selecciona "Vegano".
* Escanea "Nutella".
* Resultado: 🔴 No Apto (Contiene Leche).

### Caso Omnívoro:
* Ve a Perfil, selecciona "Omnívoro".
* Escanea "Nutella".
* Resultado: 🟢/🟡 Apto (Score nutricional bajo, pero compatible).

## 🚀 Despliegue en Producción

### Frontend (Vercel)
```bash
cd foodscan-frontend
vercel --prod
```

### Backend (Railway/Render)
1. Conectar repositorio GitHub
2. Configurar variables de entorno en Dashboard
3. Auto-deploy en push a `main`

## 🤖 Diario de IA

Ver [`IA_WORKLOG.md`](./IA_WORKLOG.md) para detalles sobre:
- Prompts utilizados en el desarrollo
- Evolución del sistema de análisis con IA
- Desafíos resueltos con asistencia de IA

## 📝 Licencia

MIT © 2026 Hugo Sabater

---

**¿Preguntas o sugerencias?** Abre un [issue](https://github.com/HugoSabater/FoodScan-AI/issues) en GitHub.
