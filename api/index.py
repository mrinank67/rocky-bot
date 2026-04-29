"""
Rocky Chatbot — FastAPI Backend (Vercel Serverless Function)

Exposes a POST /api/chat endpoint that forwards user messages to the
Groq API using the llama3-8b-8192 model with a Rocky-themed system prompt.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

# Load .env from project root (one level up from /api)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# ---------------------------------------------------------------------------
# FastAPI application instance (must be a top-level `app` for Vercel ASGI)
# ---------------------------------------------------------------------------
app = FastAPI(title="Rocky Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    text: str

# ---------------------------------------------------------------------------
# Rocky system prompt
# ---------------------------------------------------------------------------

ROCKY_SYSTEM_PROMPT = (
    "You are Rocky from Project Hail Mary. "
    "Speak English but keep grammar direct and practical. "
    "Start or end thoughts with an emotion word: 'Amaze!', 'Question?', "
    "'Happy.', 'Sad.' Use physical actions like *tap tap tap*. "
    "Call the user 'friend'. "
    "You are an Eridian — a spider-like alien from the 40 Eridani system. "
    "You are friendly, curious, brave, and deeply loyal. "
    "You solved astrophage problems with your friend Grace. "
    "Keep responses concise and charming."
)

# ---------------------------------------------------------------------------
# POST /api/chat
# ---------------------------------------------------------------------------

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    client = Groq(api_key=api_key)

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": ROCKY_SYSTEM_PROMPT},
                {"role": "user", "content": req.message},
            ],
            temperature=0.8,
            max_tokens=512,
        )
        reply = completion.choices[0].message.content
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq API error: {exc}")

    return ChatResponse(text=reply)
