# 🪨 Rocky — Project Hail Mary Chatbot

A serverless chatbot featuring **Rocky**, the beloved Eridian alien from Andy Weir's *Project Hail Mary*. Chat with Rocky and hear synthesized alien chords generated in real-time via the Web Audio API.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM-purple)
![Vercel](https://img.shields.io/badge/Vercel-000?style=flat&logo=vercel&logoColor=white)

---

## ⚡ Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| **Backend**  | Python 3.9+, FastAPI, Groq SDK (`llama-3.1-8b-instant`) |
| **Frontend** | Vanilla HTML/JS/CSS, Web Audio API            |
| **Deploy**   | Vercel Serverless Functions                   |



## 🎵 Eridian Chords

Rocky's responses are accompanied by synthesized alien chords using the **Web Audio API**:

- **3 overlapping sine-wave oscillators** at harmonic ratios (1×, 1.25×, 1.5×)
- **Pitch shifts every 200ms** within 220–550 Hz range
- **LFO Modulation** for natural volume swells and breathing
- **Convolution Reverb** for a spacey, environmental depth
- **Dynamic Duration** randomizing between 1–3 seconds

No external audio files or TTS services are used — it's pure synthesis in the browser.

---

## 👽 The Experience

The interface is styled with a custom Eridian aesthetic:
- **Warm brown and beige tones** reflecting Rocky's rocky exterior.
- **Drifting starfield** background for deep-space immersion.
- **Broken English persona**: The AI is strictly prompted to use Rocky's fragmented grammar, drop articles, and use emotion words like *Amaze!* and *Sad.*

---

## 📝 License

MIT — feel free to fork and make Rocky your own!

> *"Good good good, friend!"* — Rocky 🪨
