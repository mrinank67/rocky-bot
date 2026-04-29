# 🕷️ Rocky — Project Hail Mary Chatbot

A serverless chatbot featuring **Rocky**, the beloved Eridian alien from Andy Weir's *Project Hail Mary*. Chat with Rocky and hear synthesized alien chords generated in real-time via the Web Audio API.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM-purple)
![Vercel](https://img.shields.io/badge/Vercel-000?style=flat&logo=vercel&logoColor=white)

---

## ⚡ Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| **Backend**  | Python 3.9+, FastAPI, Groq SDK (`llama3-8b-8192`) |
| **Frontend** | Vanilla HTML/JS/CSS, Web Audio API            |
| **Deploy**   | Vercel Serverless Functions                   |

## 📁 Project Structure

```
rocky-bot/
├── api/
│   └── index.py          # FastAPI app (Vercel serverless function)
├── public/
│   └── index.html         # Chat UI + Eridian chord synthesizer
├── requirements.txt       # Python dependencies
├── vercel.json            # Vercel build & routing config
└── README.md
```

---

## 🚀 Deployment Guide

### 1. Get a Groq API Key

1. Go to [console.groq.com](https://console.groq.com/) and create an account.
2. Navigate to **API Keys** in the sidebar.
3. Click **Create API Key**, give it a name, and copy the key.

### 2. Deploy to Vercel

#### Option A — Vercel Dashboard (Recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In **Settings → Environment Variables**, add:
   | Name            | Value              |
   | --------------- | ------------------ |
   | `GROQ_API_KEY`  | `gsk_your_key_here` |
4. Click **Deploy**. Done! 🎉

#### Option B — Vercel CLI

```bash
# Install the Vercel CLI
npm i -g vercel

# Login
vercel login

# Set the environment variable
vercel env add GROQ_API_KEY

# Deploy
vercel --prod
```

### 3. Visit Your App

Once deployed, Vercel provides a URL like `https://rocky-bot-xxx.vercel.app`. Open it in any browser and start chatting with Rocky!

---

## 🛠️ Local Development

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set the API key
# PowerShell:
$env:GROQ_API_KEY = "gsk_your_key_here"
# Bash:
export GROQ_API_KEY="gsk_your_key_here"

# Run the FastAPI server
uvicorn api.index:app --reload --port 8000
```

Then open `public/index.html` in your browser (or serve it with any static file server on port 3000 and proxy `/api` to `localhost:8000`).

---

## 🎵 Eridian Chords

Rocky's responses are accompanied by synthesized alien chords using the **Web Audio API**:

- **3 overlapping sine-wave oscillators** at harmonic ratios (1×, 1.25×, 1.5×)
- **Pitch shifts every 200ms** within 220–550 Hz range
- **Duration scales with response length** (50ms per character)
- **Smooth fade-out** at the end of playback

No external audio files or TTS services are used — it's pure synthesis in the browser.

---

## 📝 License

MIT — feel free to fork and make Rocky your own!

> *"Good good good, friend!"* — Rocky 🕷️
