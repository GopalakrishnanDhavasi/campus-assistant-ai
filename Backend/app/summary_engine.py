import math
import time
from typing import Callable, Dict, Any, List
from .core_utils import get_all_chunks_from_collection

def summarize_entire_collection_map_reduce(
    collection,
    call_llm_fn: Callable[[str, int, float], str],
    batch_size: int = 6,
    intermediate_max_tokens: int = 512,
    final_max_tokens: int = 1500,  # Increased for better detail
    intermediate_instruction: str = None,
    final_instruction: str = None,
    snippet_max_chars: int = 1500,
    show_progress: bool = True,
    llm_retry: int = 1,
    retry_backoff: float = 1.0,
    temperature: float = 0.0,
    model_token_limit: int = 8000,
    compression_batch_size: int = 8,
    compression_max_rounds: int = 3
) -> Dict[str, Any]:
    
    # 1. INTERMEDIATE STEP: Same as before (Get the facts)
    if intermediate_instruction is None:
        intermediate_instruction = (
            "Using ONLY the provided context, write a detailed explanation of all important ideas. "
            "DO NOT include any '(source: ...)' or chunk IDs. "
            "Summaries should be factual and complete, 6–10 sentences each. "
            "Return only the rewritten explanation."
        )

    # 2. FINAL STEP: UPDATED FOR DYNAMIC TOPICS
    if final_instruction is None:
        final_instruction = (
            "You are a professional technical writer. "
            "Using ONLY the information inside the intermediate summaries provided, create a comprehensive, "
            "well-structured document summary.\n\n"
            "INSTRUCTIONS:\n"
            "1. Do NOT use generic or fixed headings. Instead, **generate your own descriptive headings** "
            "   that perfectly match the specific topics discussed in the text.\n"
            "2. Start with a broad **Overview** section.\n"
            "3. Organize the rest of the content into logical sections based on the themes found in the text.\n"
            "4. Ensure the summary flows naturally like a professionally written report.\n"
            "5. Do NOT mention chunk IDs, source numbers, or internal metadata.\n\n"
            "Goal: A structured, easy-to-read report that adapts its outline to the content."
        )

    # ... (The rest of the function logic remains exactly the same) ...

    # Internal helper: robustly fetch chunks from Chroma collection
    def _estimate_tokens_from_text(text: str) -> int:
        if not text: return 0
        return max(1, int(len(text) / 4))

    def _compress_intermediates(intermediates: List[str], round_idx: int) -> List[str]:
        compressed = []
        if not intermediates: return compressed
        for i in range(0, len(intermediates), compression_batch_size):
            batch_slice = intermediates[i:i + compression_batch_size]
            batch_context = "\n\n".join([f"INTERMEDIATE_SUMMARY_{i + idx}:\n{txt}" for idx, txt in enumerate(batch_slice)])
            compress_instruction = (
                "You are given multiple intermediate summaries. For each INTERMEDIATE_SUMMARY_x: "
                "Produce a very short compressed summary (1-2 sentences) that preserves the main point. "
                "Return each compressed summary in the same order, separated by a blank line."
            )
            compress_prompt = f"{compress_instruction}\n\n{batch_context}\n\nReturn only the compressed summaries in order."
            try:
                comp_resp = call_llm_fn(compress_prompt, intermediate_max_tokens, temperature)
                comp_resp = comp_resp.strip() if isinstance(comp_resp, str) else str(comp_resp).strip()
            except Exception as e:
                if show_progress: print(f"[Compress] LLM compression failed (round {round_idx}): {e}")
                comp_resp = "\n\n".join(batch_slice)
            parts = [p.strip() for p in comp_resp.split("\n\n") if p.strip()]
            for j in range(len(batch_slice)):
                if j < len(parts): compressed.append(parts[j])
                else: compressed.append(batch_slice[j])
            time.sleep(0.05)
        return compressed

    all_chunks = get_all_chunks_from_collection(collection)
    if not all_chunks:
        raise ValueError("No chunks found in collection.")

    try:
        all_chunks_sorted = sorted(all_chunks, key=lambda c: c.get("metadata", {}).get("start_char", 0))
    except Exception:
        all_chunks_sorted = all_chunks

    batches = [all_chunks_sorted[i:i + batch_size] for i in range(0, len(all_chunks_sorted), batch_size)]
    intermediate_summaries = []

    for batch_idx, batch in enumerate(batches):
        context_parts = []
        for c in batch:
            text = c.get("text", "") or ""
            snippet = text if len(text) <= snippet_max_chars else text[:snippet_max_chars] + "..."
            context_parts.append(f"SOURCE_ID: {c['id']}\n{snippet}")
        context = "\n\n---\n\n".join(context_parts)
        prompt = f"{intermediate_instruction}\n\nContext:\n{context}\n\nReturn the summary only."
        
        if show_progress: print(f"[Map] Summarizing batch {batch_idx+1}/{len(batches)}...")
        
        intermediate = ""
        attempt = 0
        while attempt <= llm_retry:
            try:
                intermediate = call_llm_fn(prompt, intermediate_max_tokens, temperature)
                if isinstance(intermediate, str): intermediate = intermediate.strip()
                if intermediate: break
            except Exception as e:
                if show_progress: print(f"LLM call failed attempt {attempt+1}: {e}")
            attempt += 1
            time.sleep(retry_backoff * attempt)
        
        if not intermediate: intermediate = "[EMPTY SUMMARY]"
        intermediate_summaries.append({"batch_idx": batch_idx, "summary": intermediate})

    intermediate_texts = [it["summary"] for it in intermediate_summaries]
    combined_intermediates = "\n\n".join([f"INTERMEDIATE_SUMMARY_{idx}:\n{txt}" for idx, txt in enumerate(intermediate_texts)])
    estimated_tokens = _estimate_tokens_from_text(combined_intermediates)
    allowed_tokens = max(0, model_token_limit - final_max_tokens - 128)

    if show_progress: print(f"[Reduce] Estimated tokens: {estimated_tokens}, Allowed: {allowed_tokens}")

    compressed_texts = intermediate_texts[:]
    round_idx = 0
    while estimated_tokens > allowed_tokens and round_idx < compression_max_rounds:
        round_idx += 1
        if show_progress: print(f"[Compress] Round {round_idx}...")
        compressed_texts = _compress_intermediates(compressed_texts, round_idx)
        combined_intermediates = "\n\n".join([f"INTERMEDIATE_SUMMARY_{idx}:\n{txt}" for idx, txt in enumerate(compressed_texts)])
        estimated_tokens = _estimate_tokens_from_text(combined_intermediates)

    # Final Reduce Call
    final_prompt = f"{final_instruction}\n\nContext (Intermediate Summaries):\n{combined_intermediates}\n\nReturn the final structured summary."
    
    if show_progress: print("[Reduce] Generating Final Dynamic Summary...")
    
    final_summary = ""
    try:
        final_summary = call_llm_fn(final_prompt, final_max_tokens, temperature)
    except Exception as e:
        if show_progress: print(f"Final LLM Error: {e}")

    return {"intermediate_summaries": intermediate_summaries, "final_summary": final_summary if final_summary else "Error generating summary."}