from typing import List, Dict, Any
from .core_utils import get_all_chunks_from_collection, call_llm_answer, call_llm_text_only,generate_multi_queries,get_wikipedia_summary

def retrieve_top_k(collection, query: str, embed_model, k: int = 4):
    import numpy as np
    q_emb = embed_model.encode([query], convert_to_numpy=True)[0].tolist()
    try:
        res = collection.query(
            query_embeddings=[q_emb],
            n_results=k,
            include=["documents", "metadatas", "distances"]
        )
    except Exception as e:
        print("Collection.query failed:", e)
        all_chunks = get_all_chunks_from_collection(collection)
        docs = [c["text"] for c in all_chunks]
        emb_all = embed_model.encode(docs, convert_to_numpy=True)
        q_np = np.array(q_emb)
        dists = np.linalg.norm(emb_all - q_np, axis=1)
        idxs = np.argsort(dists)[:k]
        return [
            {
                "id": all_chunks[i].get("metadata", {}).get("id", f"chunk_{i}"),
                "text": all_chunks[i]["text"],
                "metadata": all_chunks[i].get("metadata", {}),
                "distance": float(dists[i])
            }
            for i in idxs
        ]

    docs = res["documents"][0]
    metas = res["metadatas"][0]
    dists = res["distances"][0]
    out = []
    for i in range(len(docs)):
        meta = metas[i] if metas and i < len(metas) else {}
        cid = meta.get("id", f"chunk_{i}")
        out.append({
            "id": cid,
            "text": docs[i],
            "metadata": meta,
            "distance": dists[i]
        })
    return out

def build_context_from_retrieval(retrieved: List[Dict[str, Any]], max_chars_per_chunk: int = 1500):
    parts = []
    for r in retrieved:
        snippet = r["text"] if len(r["text"]) <= max_chars_per_chunk else r["text"][:max_chars_per_chunk] + "..."
        parts.append(f"SOURCE_ID: {r['id']}\n{snippet}")
    return "\n\n---\n\n".join(parts)

def answer_question_rag(question: str, collection, embed_model, call_llm_fn=call_llm_answer, k: int = 4, temperature: float = 0.0, max_tokens: int = 512):
    """
    Hybrid RAG:
    1. Try Multi-Query RAG on local documents.
    2. If the answer is "I don't know", fallback to Wikipedia.
    """
    
    # --- PHASE 1: LOCAL RAG (Multi-Query) ---
    print(f"Generating variations for: '{question}'...")
    queries = generate_multi_queries(question, call_llm_fn)
    
    all_retrieved = []
    seen_ids = set()
    
    for q in queries:
        docs = retrieve_top_k(collection, q, embed_model, k=k)
        for doc in docs:
            if doc['id'] not in seen_ids:
                seen_ids.add(doc['id'])
                all_retrieved.append(doc)
    
    final_retrieved = all_retrieved[:8] 
    context = build_context_from_retrieval(final_retrieved)
    
    instruction = (
        "Using ONLY the provided context below, answer the user question precisely and concisely. "
        "If the answer is strictly NOT present in the context, output EXACTLY this phrase: 'I don't know based on the provided document.'"
    )

    prompt = f"{instruction}\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    
    try:
        llm_resp = call_llm_text_only(prompt, max_tokens=max_tokens, temperature=temperature)
    except NameError:
        llm_resp = call_llm_fn(prompt, max_tokens=max_tokens, temperature=temperature)
    
    final_answer = llm_resp.strip()

    # --- PHASE 2: WIKIPEDIA FALLBACK ---
    
    # Check if the AI gave up
    if "I don't know based on the provided document" in final_answer or len(final_answer) < 5:
        print("I don't know based on the provided document Local RAG failed. Searching Wikipedia...")
        wiki_result = get_wikipedia_summary(question)
        
        if wiki_result:
            final_answer = f"I couldn't find that in your uploaded documents, but here is what I found on Wikipedia:\n\n{wiki_result}"
        else:
            final_answer = "I couldn't find that information in your documents or on Wikipedia."

    sources = [r["id"] for r in final_retrieved]
    
    return {"question": question, "answer": final_answer, "sources": sources, "prompt": prompt}