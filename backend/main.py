import os
import shutil
import uuid
import json
import logging
from typing import List, Optional
from pydantic import BaseModel

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

# Initialize App
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration & Initialization ---

# 1. RAG: ChromaDB & SentenceTransformer
PERSIST_DIRECTORY = os.path.join(os.path.dirname(__file__), "db")
chroma_client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)
collection = chroma_client.get_or_create_collection(name="interviews")

model = SentenceTransformer('all-MiniLM-L6-v2')

# 2. OpenAI Client
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=openai_api_key) if openai_api_key else None

# 3. Supabase Client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Optional[Client] = None

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

# --- Models ---

class AnalysisRequest(BaseModel):
    transcript: str
    session_id: str
    user_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: list

# --- Helper Functions ---

def retrieve_context(query: str, n_results: int = 3) -> List[str]:
    try:
        results = collection.query(
            query_embeddings=model.encode([query]).tolist(),
            n_results=n_results
        )
        documents = results.get('documents', [])
        if documents and len(documents) > 0:
            return documents[0]
        return []
    except Exception as e:
        print(f"RAG Error: {e}")
        return []

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Backend is running", "architecture": "REST"}

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    # 1. RAG Step: Get Resume Context
    context_list = retrieve_context(req.message)
    context = "\n".join(context_list)
    
    # 2. System Prompt (The "Alex" Persona)
    system_prompt = f"""
    You are 'Alex', a Technical Recruiter conducting an interview.
    CONTEXT FROM CANDIDATE'S RESUME:
    {context}
    
    GOAL: Assess the candidate's fit for the role.
    STYLE: Professional, concise (under 2 sentences per response). Ask exactly ONE question at a time.
    """
    
    # 3. Call OpenAI
    messages = [{"role": "system", "content": system_prompt}] + req.history + [{"role": "user", "content": req.message}]
    
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        answer = completion.choices[0].message.content
        return {"reply": answer}
    except Exception as e:
        logging.error(f"OpenAI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        reader = PdfReader(temp_file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"

        if not text.strip():
             raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        chunk_size = 1000
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        ids = [str(uuid.uuid4()) for _ in chunks]
        embeddings = model.encode(chunks).tolist()
        
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=ids,
            metadatas=[{"source": file.filename} for _ in chunks]
        )

        return {
            "message": "Resume processed and stored successfully", 
            "chunks_count": len(chunks),
            "extracted_text": text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/api/analyze-interview")
async def analyze_interview(request: AnalysisRequest):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    system_prompt = (
        "Analyze this interview transcript. Return valid JSON with keys: "
        "technical_score (0-100), communication_score (0-100), problem_solving_score (0-100), cultural_fit_score (0-100), "
        "technical_feedback (string), communication_feedback (string), problem_solving_feedback (string), cultural_fit_feedback (string), "
        "overall_summary (2 sentences)."
    )
    
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.transcript}
            ],
            response_format={"type": "json_object"}
        )
        
        analysis_content = completion.choices[0].message.content
        if not analysis_content:
             raise HTTPException(status_code=500, detail="Failed to generate analysis content")
             
        analysis_json = json.loads(analysis_content)
        
        if supabase:
             data = {
                 "session_id": request.session_id,
                 "transcript": request.transcript,
                 "technical_score": analysis_json.get("technical_score"),
                 "communication_score": analysis_json.get("communication_score"),
                 "json_analysis": analysis_json,
                 "user_id": request.id # Note: verify from schema if this should be 'user_id' or request object
             }
             supabase.table("interview_history").insert(data).execute()
        
        return analysis_json

    except Exception as e:
        print(f"Error analyzing interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))
