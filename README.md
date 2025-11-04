<div align="center">
  <img width="1200" height="475" alt="Near Buy Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>Near Buy</h1>
  <p><strong>Your intelligent shopping assistant that finds the best local prices and plans the most efficient route to get everything you need.</strong></p>
  <p>
    <a href="#key-features">Features</a> •
    <a href="#technologies-used">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#project-structure">Project Structure</a>
  </p>
</div>

---

**Near Buy** is a smart Progressive Web App (PWA) that streamlines your shopping. Input a list or an idea, and our AI assistant finds the best local prices for groceries and gas, then plans an optimized multi-stop route to save you time and money.

## ✨ Key Features

- **🧠 AI List Generation**: Create shopping lists from text ideas (e.g., "Taco night for 4") or photos of recipes.
- **💰 Local Price Finder**: Compare item prices across nearby grocery stores and find the cheapest local gas.
- **🗺️ Smart Route Planning**: Automatically generate the most cost-effective, multi-stop shopping route.
- **✏️ Custom Routes**: Modify the AI's suggested route or build your own from scratch.
- **✅ Shopping Run Mode**: Use an interactive checklist to track items as you shop.
- **💾 Save & Load**: Keep your lists and search results for future use.
- **📱 PWA Ready**: Installable on your device, responsive, and offers offline access to saved data.
- **🎨 Dark Mode**: Supports both light and dark themes.

## 🛠️ Technologies Used

- **Frontend**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash` for speed, `gemini-2.5-pro` for complex reasoning)
- **Maps & Location**: Google Maps (via Gemini grounding), Browser Geolocation API
- **Offline Storage**: Service Workers, `localStorage` API
- **Deployment**: [Docker](https://www.docker.com/), [Nginx](https://www.nginx.com/), [Google Cloud Run](https://cloud.google.com/run)

## 🚀 Getting Started

This project uses modern web standards (`importmap`) and does not require a complex build setup like Webpack or Vite to run locally. You only need a simple static file server.

**Prerequisites:**
-   [Node.js](https://nodejs.org/) (used to run a local server)
-   A valid Gemini API key. Get one from [Google AI for Developers](https://ai.google.dev/).

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/near-buy.git
    cd near-buy
    ```

2.  **Set your API Key:**
    The application is hardcoded to look for the API key in `process.env.API_KEY`. The simplest way to provide this for local development is to perform a find-and-replace in the code:
    -   Search for `process.env.API_KEY` within the project.
    -   Replace all instances with your actual Gemini API key string: `'YOUR_API_KEY_HERE'`.
    -   **Important**: Remember to revert this change before committing your code!

3.  **Run a local server:**
    This project does not need an `npm install` step for dependencies. You can serve the files directly. The easiest way is using the `http-server` package.

    ```bash
    # Install http-server globally
    npm install -g http-server

    # Run the server from the project's root directory
    http-server
    ```

4.  **Open the app:**
    Navigate to `http://localhost:8080` (or the URL provided by `http-server`) in your browser.

## ☁️ Deployment

This application is ready to be deployed as a container, for example, on Google Cloud Run.

### Deploying to Google Cloud Run

1.  **Prerequisites:**
    -   [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured.
    -   A Google Cloud project with the Cloud Run and Artifact Registry APIs enabled.

2.  **Build and Deploy:**
    From the root directory of the project, run the following `gcloud` command. Replace `[PROJECT-ID]` with your Google Cloud Project ID and `[APP-NAME]` with your desired service name.

    ```bash
    # This command builds the container image using the Dockerfile and deploys it to Cloud Run.
    gcloud run deploy [APP-NAME] --source . --allow-unauthenticated --set-env-vars="API_KEY=YOUR_GEMINI_API_KEY"
    ```
    - `--source .` tells gcloud to build from the current directory.
    - `--allow-unauthenticated` makes the app publicly accessible.
    - `--set-env-vars` securely provides your API key to the application as an environment variable.

The command will provide you with a public URL for your deployed application.

## 📁 Project Structure

```
.
├── 📄 Dockerfile            # Instructions for building the production container
├── 📄 nginx.conf            # Nginx configuration for serving the app
├── 📄 index.html            # Main HTML entry point, includes importmap for dependencies
├── 📄 index.tsx             # Root React component render
├── 📄 App.tsx               # Main application component, handles state and logic
├── 📁 components/           # Reusable React components (e.g., StoreCard, Input fields)
├── 📁 services/             # Logic for interacting with the Gemini API
├── 📁 hooks/                # Custom React hooks (e.g., useLocation, useTheme)
├── 📄 types.ts              # Core TypeScript type definitions for the app
├── 📄 service-worker.js     # PWA service worker for caching and offline support
└── 📄 README.md             # You are here!
```