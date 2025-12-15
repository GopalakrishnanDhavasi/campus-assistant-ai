from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from typing import List
from pydantic import BaseModel

# Import the service we just built
from app.rag_engine import rag_service

app = FastAPI()

# 1. CORS Setup (Allows your React frontend to talk to this Python backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace '*' with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Define Request Models
class ChatRequest(BaseModel):
    query: str

# 3. API Endpoints

@app.get("/")
def read_root():
    return {"message": "RAG Backend is Running!"}


@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Uploads multiple files (Max 5), merges them, and processes chunks.
    """
    # 1. Validation: Max 5 files
    if len(files) > 5:
        return {"status": "error", "message": "Maximum 5 files allowed."}

    saved_file_paths = []
    
    try:
        # 2. Save all files temporarily
        for file in files:
            file_location = f"temp_{file.filename}"
            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(file.file, file_object)
            saved_file_paths.append(file_location)
        
        # 3. Process all files together
        status_message = rag_service.process_files(saved_file_paths)
        
        return {"status": "success", "message": status_message}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
    finally:
        # 4. Cleanup: Delete temp files
        for path in saved_file_paths:
            if os.path.exists(path):
                os.remove(path)

@app.get("/summarize")
def get_summary():
    """
    Trigger map-reduce summarization
    """
    try:
        summary_text = rag_service.generate_summary()
        return {"summary": summary_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat_bot(payload: ChatRequest):
    """
    Chat with the PDF
    """
    try:
        response_text = rag_service.chat(payload.query)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/quiz")
def get_quiz():
    """
    Generate a quiz
    """
    try:
        quiz_data = rag_service.generate_quiz()
        return {"quiz": quiz_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ... existing imports ...

class SaveSummaryRequest(BaseModel):
    filename: str
    summary_text: str

# --- SUMMARY LIBRARY ENDPOINTS ---

@app.get("/library/summaries")
def get_summary_library():
    return {"files": rag_service.get_saved_summaries()}

@app.get("/library/summaries/{filename}")
def load_summary_endpoint(filename: str):
    text = rag_service.load_summary(filename)
    if not text:
        raise HTTPException(status_code=404, detail="Summary not found")
    return {"summary": text}

@app.post("/save_summary")
def save_summary_endpoint(payload: SaveSummaryRequest):
    try:
        rag_service.save_current_summary(payload.filename, payload.summary_text)
        return {"status": "success", "message": f"Saved as {payload.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add a model for saving
class SaveQuizRequest(BaseModel):
    filename: str
    quiz_data: list

@app.get("/library")
def get_library():
    """Get list of all saved quizzes"""
    return {"files": rag_service.get_saved_quizzes()}

@app.get("/library/{filename}")
def load_library_quiz(filename: str):
    """Load a specific quiz"""
    quiz = rag_service.load_quiz(filename)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {"quiz": quiz}

@app.post("/save_quiz")
def save_quiz_endpoint(payload: SaveQuizRequest):
    """Save a quiz with a custom name"""
    try:
        rag_service.save_current_quiz(payload.filename, payload.quiz_data)
        return {"status": "success", "message": f"Saved as {payload.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))