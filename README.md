# 🐦 Tuktuki AI

A beautiful, production-ready AI chatbot web application inspired by ChatGPT — built with vanilla HTML/CSS/JS on the frontend, Express.js on the backend, and powered by the Google Gemini API.

![Tuktuki AI](https://img.shields.io/badge/status-production--ready-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-green)

---

## ✨ Features

- 🌙 Premium dark theme with glassmorphism (light theme toggle included)
- 📱 Fully responsive — mobile, tablet, and desktop
- 💬 ChatGPT-style sidebar with chat history stored in `localStorage`
- 🆕 New Chat button — start fresh conversations anytime
- 📝 Full Markdown rendering + syntax-highlighted code blocks
- 📋 One-click copy for messages and code snippets
- ⌨️ `Enter` to send, `Shift + Enter` for a new line
- 🔄 Typing / loading animation while the AI responds
- 🔒 API key is kept 100% private on the backend — never exposed to the browser
- 🚀 Ready to deploy: frontend → GitHub Pages, backend → Render (free tier)

---

## 📁 Project Structure

```
tuktuki-ai/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🧰 Tech Stack

| Layer      | Technology                     |
|------------|---------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript |
| Backend    | Node.js, Express.js              |
| AI Engine  | Google Gemini API                |
| Hosting    | GitHub Pages (frontend), Render (backend) |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher installed
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone or download this project

```bash
git clone https://github.com/YOUR_USERNAME/tuktuki-ai.git
cd tuktuki-ai
```

### 2. Set up the backend

```bash
cd backend
npm install
```

### 3. Create your `.env` file

Copy the example file and add your Gemini API key:

```bash
cp .env.example .env
```

Open `.env` and paste your key:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=5000
ALLOWED_ORIGIN=*
```

### 4. Run the backend server

```bash
node server.js
```

You should see:

```
🐦 Tuktuki AI backend running on http://localhost:5000
   Model: gemini-1.5-flash
   POST http://localhost:5000/chat
```

### 5. Run the frontend

The frontend is 100% static — no build step required. Simply open `frontend/index.html` in your browser, **or** serve it locally for the best experience:

```bash
cd ../frontend
npx serve .
```

Then visit the printed local URL (e.g. `http://localhost:3000`). The frontend is already configured to call `http://localhost:5000/chat`, so it will work immediately with your local backend.

---

## 🔑 Getting a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the generated key
5. Paste it into `backend/.env` as `GEMINI_API_KEY`

The free tier is generous and perfect for personal projects and demos.

---

## ☁️ Deploying the Backend to Render (Free)

1. Push this project to a GitHub repository (see Git steps below).
2. Go to [render.com](https://render.com) and sign in / sign up.
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
6. Add environment variables under **Environment**:
   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = `gemini-1.5-flash`
   - `ALLOWED_ORIGIN` = your GitHub Pages URL (e.g. `https://yourusername.github.io`)
7. Click **Create Web Service**.
8. Once deployed, Render will give you a URL like:
   ```
   https://tuktuki-ai-backend.onrender.com
   ```
9. Test it by visiting that URL in your browser — you should see a JSON status message.

> ⚠️ Note: Render's free tier spins down after inactivity, so the first request after idling may take 30–60 seconds to respond.

---

## 🌐 Deploying the Frontend to GitHub Pages

1. Push your project to GitHub (see below).
2. In your repository, go to **Settings** → **Pages**.
3. Under **Source**, select the branch (e.g. `main`) and set the folder to `/frontend` (or move frontend files to a `docs/` folder if GitHub Pages requires it, or use root — see note below).
4. Click **Save**.
5. GitHub will publish your site at:
   ```
   https://yourusername.github.io/tuktuki-ai/
   ```

> 💡 **Tip:** GitHub Pages can only serve from the repository root or a `/docs` folder. If your Pages settings don't allow selecting `/frontend`, either:
> - Move the contents of `frontend/` into a `/docs` folder and select `/docs` as the source, or
> - Create a separate repository containing only the frontend files, or
> - Use GitHub Actions to deploy the `frontend/` folder to the `gh-pages` branch.

---

## 🔗 Pushing to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Tuktuki AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tuktuki-ai.git
git push -u origin main
```

---

## ⚙️ Connecting Frontend to Your Deployed Backend

After your backend is live on Render, open `frontend/script.js` and update the very first constant:

```js
// >>> CHANGE THIS AFTER DEPLOYING YOUR BACKEND TO RENDER <<<
const API_URL = "http://localhost:5000/chat";
```

Replace it with your live Render URL:

```js
const API_URL = "https://tuktuki-ai-backend.onrender.com/chat";
```

Commit and push this change — GitHub Pages will automatically redeploy your frontend, and your chatbot will be fully live! 🎉

---

## 🛠️ Troubleshooting

**"GEMINI_API_KEY is not set" warning on startup**
Make sure `backend/.env` exists and contains a valid `GEMINI_API_KEY`. It must NOT be committed to GitHub — it's already excluded via `.gitignore`.

**CORS errors in the browser console**
Set `ALLOWED_ORIGIN` in your Render environment variables to your exact GitHub Pages URL (no trailing slash), e.g. `https://yourusername.github.io`. Use `*` only for local testing.

**Chatbot shows "Failed to get response" or network errors**
- Confirm the backend is running and reachable at the URL set in `API_URL`.
- If using Render's free tier, the server may be "waking up" — wait 30–60 seconds and try again.
- Open your browser's DevTools → Network tab to inspect the actual error response.

**"No response generated from Gemini" error**
This usually means the prompt was blocked by safety filters, or the Gemini API key/model is invalid. Verify your API key at [Google AI Studio](https://aistudio.google.com/app/apikey) and confirm `GEMINI_MODEL` is a valid, currently available model name.

**Chat history disappeared**
Chat history is stored in your browser's `localStorage`, scoped per-domain. Clearing browser data, using a different browser, or private/incognito mode will reset it.

**Port already in use locally**
Change the `PORT` value in `backend/.env` to any free port (e.g. `5050`), then restart the server.

---

## 📋 Quick Reference — Setup Steps

1. **Install Node.js packages**
   ```bash
   cd backend && npm install
   ```
2. **Run backend**
   ```bash
   node server.js
   ```
3. **Create `.env`** — paste your Gemini API Key
4. **Push to GitHub**
5. **Deploy backend to Render**
6. **Deploy frontend to GitHub Pages**
7. **Replace `API_URL`** in `frontend/script.js` with your Render backend URL
8. **Website becomes live!** 🚀

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

Built with 💜 for developers who want a beautiful, fully working AI chatbot out of the box.
