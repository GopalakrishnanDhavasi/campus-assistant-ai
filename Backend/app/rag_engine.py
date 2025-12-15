import os
import chromadb
from sentence_transformers import SentenceTransformer

# Import Logic Modules
from .core_utils import (
    extract_text_universal,  # <--- NEW IMPORT
    build_combined_document, 
    simple_chunk_text, 
    upsert_chunks_to_chroma,
    save_quiz_to_disk,      # <--- New Import
    list_saved_quizzes,     # <--- New Import
    load_quiz_from_disk,
    call_llm_text_only,
    call_llm_answer,
    save_summary_to_disk, list_saved_summaries, load_summary_from_disk
)
from .summary_engine import summarize_entire_collection_map_reduce
from .chat_engine import answer_question_rag
from .quiz_engine import quiz_from_full_summary

class RAGService:
    def __init__(self):
        print("Initializing RAG Service...")
        self.embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        
        persist_dir = "./chroma_db_storage"
        os.makedirs(persist_dir, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=persist_dir)
        
        try:
            self.collection = self.client.get_collection(name="pdf_store")
        except:
            self.collection = self.client.create_collection(name="pdf_store")
        
    def process_files(self, file_paths: list):
        """
        1. RESET DB
        2. Iterate through all files -> Extract Text
        3. Merge text into one document structure
        4. Chunk & Upsert
        """
        print(f"Processing {len(file_paths)} files...")

        # 1. Reset Database
        try:
            self.client.delete_collection(name="pdf_store")
        except Exception:
            pass
        self.collection = self.client.create_collection(name="pdf_store")

        all_pages = []

        # 2. Extract Text from Each File
        for path in file_paths:
            try:
                # Extract raw pages
                file_pages = extract_text_universal(path)
                
                # Add Filename to Page Number (e.g., "lecture1.pdf - Page 1")
                # This ensures the AI knows which document the info came from.
                filename = os.path.basename(path).replace("temp_", "")
                for p in file_pages:
                    p["page_number"] = f"{filename} (Page {p['page_number']})"
                
                all_pages.extend(file_pages)
                
            except ValueError as e:
                print(f"Skipping file {path}: {e}")
                continue

        if not all_pages:
            return "Error: No text could be extracted from any of the uploaded files."

        # 3. Merge & Chunk
        doc = build_combined_document(all_pages)
        chunks = simple_chunk_text(doc["combined_text"])
        
        print(f"Total merged chunks: {len(chunks)}")
        
        # 4. Upsert to Chroma
        upsert_chunks_to_chroma(chunks, self.embed_model, self.collection)
        
        return f"Successfully processed {len(file_paths)} files. Merged into {len(chunks)} chunks."

    def generate_summary(self):
        """Concept 2: Summary"""
        print("Starting Summary Generation...")
        result = summarize_entire_collection_map_reduce(
            collection=self.collection,
            call_llm_fn=call_llm_text_only,
            batch_size=6 
        )
        return result["final_summary"]

    def chat(self, query):
        """Concept 3: Q&A"""
        print(f"Chat Query: {query}")
        result = answer_question_rag(
            question=query, 
            collection=self.collection, 
            embed_model=self.embed_model,
            call_llm_fn=call_llm_answer
        )
        return result["answer"]
    
    # ... inside RAGService class ...

    def generate_quiz(self):
        """Concept 4: Quiz (Generates AND Saves)"""
        print("Generating Quiz...")
        quiz_data = quiz_from_full_summary(
            collection=self.collection,
            embed_model=self.embed_model,
            call_llm_fn=call_llm_answer,
            summarizer_fn=summarize_entire_collection_map_reduce
        )
        
        # --- NEW: SAVE TO DISK ---
        # We try to find a source filename from the collection metadata to name the file
        try:
            # Get the first chunk's metadata to find the source name
            # We stored it like "filename.pdf (Page 1)" in process_files
            existing_chunks = self.collection.get(limit=1)
            if existing_chunks['metadatas'] and len(existing_chunks['metadatas']) > 0:
                # Extract filename from "filename.pdf (Page X)" logic if you used that, 
                # or just use a default name.
                # Since we didn't strictly store clean filenames in metadata in the previous step,
                # let's generate a name based on the first document text or timestamp.
                # BETTER: Let's assume the user just processed a file.
                pass
        except:
            pass
            
        # For simplicity, we will save it with a generic name or pass the name from the API.
        # But here, let's just return data. The API (main.py) allows renaming.
        return quiz_data
    
    def save_current_summary(self, filename: str, summary_text: str):
        return save_summary_to_disk(filename, summary_text)

    def get_saved_summaries(self):
        return list_saved_summaries()

    def load_summary(self, filename: str):
        return load_summary_from_disk(filename)

    def save_current_quiz(self, filename: str, quiz_data: list):
        """Manually save the quiz with a specific name"""
        return save_quiz_to_disk(filename, quiz_data)

    def get_saved_quizzes(self):
        return list_saved_quizzes()

    def load_quiz(self, filename: str):
        return load_quiz_from_disk(filename)

    def generate_quiz(self):
        """Concept 4: Quiz"""
        print("Generating Quiz...")
        return quiz_from_full_summary(
            collection=self.collection,
            embed_model=self.embed_model,
            call_llm_fn=call_llm_answer,
            summarizer_fn=summarize_entire_collection_map_reduce
        )

rag_service = RAGService()