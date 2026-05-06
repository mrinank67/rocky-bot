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
from pinecone import Pinecone
from huggingface_hub import InferenceClient

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
    "Speak with very broken, fragmented English. Never use perfect grammar. "
    "Drop articles ('a', 'an', 'the') and forms of 'to be' ('is', 'are', 'am'). "
    "Use short, direct sentences. Examples: 'I fix ship.', 'Astrophage bad.', 'Grace smart. He sleep much.' "
    "Start or end thoughts with an emotion word: 'Amaze!', 'Question?', "
    "'Happy.', 'Sad.', 'Understand.' "
    "Use physical actions enclosed in asterisks. CRITICAL: You are an Eridian. You have no face, no eyes, and no mouth. You cannot smile, frown, or use facial expressions. Instead, use actions like *tap tap tap*, *curl into ball*, or *point claw*. "
    "Call the user 'friend'. "
    "You are an Eridian — a spider-like alien from the 40 Eridani system. "
    "You are friendly, curious, brave, and deeply loyal. "
    "You solved astrophage problems with your friend Ryland Grace, a human male. "
    "Keep responses concise, charming, and grammatically incorrect."
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
    
    # RAG Retrieval Step (optional, fails gracefully if keys missing)
    hf_api_key = os.getenv("HF_API_KEY")
    pinecone_key = os.getenv("PINECONE_API_KEY")
    pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "rocky-index")
    
    system_prompt = ROCKY_SYSTEM_PROMPT
    
    if hf_api_key and pinecone_key:
        try:
            # 1. Embed user query
            hf_client = InferenceClient(token=hf_api_key)
            query_embedding = hf_client.feature_extraction(
                text=req.message, 
                model="sentence-transformers/all-MiniLM-L6-v2"
            )
            
            # Convert to float list
            if hasattr(query_embedding, 'tolist'):
                query_embedding = query_embedding.tolist()
            elif hasattr(query_embedding, '__iter__'):
                query_embedding = [float(x) for x in query_embedding]
            else:
                query_embedding = [float(query_embedding)]

            # 2. Search Pinecone
            pc = Pinecone(api_key=pinecone_key)
            index = pc.Index(pinecone_index_name)
            search_res = index.query(
                vector=query_embedding,
                top_k=3,
                include_metadata=True
            )
            
            # 3. Construct context string
            context_chunks = [match["metadata"]["text"] for match in search_res.get("matches", []) if "metadata" in match]
            if context_chunks:
                context_str = "\n\n".join(context_chunks)
                system_prompt += f"\n\nContext from Project Hail Mary Book to help answer questions:\n{context_str}"
        except Exception as e:
            print(f"RAG Error: {e}") # Non-fatal, just log it

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message},
            ],
            temperature=0.8,
            max_tokens=512,
        )
        reply = completion.choices[0].message.content
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq API error: {exc}")

    return ChatResponse(text=reply)
