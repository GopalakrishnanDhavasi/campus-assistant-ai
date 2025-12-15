import json
import re
from .core_utils import call_llm_answer, get_all_chunks_from_collection

def generate_mcqs_from_context(context: str, n_questions: int = 5, call_llm_fn=call_llm_answer, temperature: float = 0.0, max_tokens: int = 2000):
    # We ask for a "clear" explanation that mentions the specific fact.
    prompt = f"""
You are a strict exam setter.
Using ONLY the information in the CONTEXT below, create EXACTLY {n_questions} multiple-choice questions (MCQs).

Each MCQ must have:
1. "question": The question text.
2. "options": A dictionary of 4 options with keys "A", "B", "C", "D".
3. "correct_option": The single correct key ("A", "B", "C", or "D").
4. "explanation": A detailed 1-2 sentence explanation of why the answer is correct, citing the context.

Return the output as a valid JSON Array of objects.

CONTEXT:
{context}

JSON OUTPUT:
"""
    raw = call_llm_fn(prompt, max_tokens=max_tokens, temperature=temperature)

    # Robust JSON Parsing Logic (re-using the fix from before)
    try:
        match = re.search(r'\[.*\]', raw, flags=re.S)
        if match:
            json_text = match.group(0)
        else:
            # Fallback for cut-off JSON
            last_brace_index = raw.rfind('}')
            if last_brace_index != -1:
                json_text = raw[:last_brace_index+1] + "]"
            else:
                json_text = raw

        data = json.loads(json_text)

        mcqs = []
        for item in data:
            mcqs.append({
                "question": item.get("question", "").strip(),
                "options": item.get("options", {}),
                "correct_option": item.get("correct_option", "").strip(),
                "explanation": item.get("explanation", "").strip()
            })
        return mcqs

    except Exception as e:
        print("❌ JSON parsing error:", e)
        return [{"raw": raw}]

def quiz_from_full_summary(collection, embed_model, call_llm_fn=call_llm_answer, n_questions=10, summarizer_fn=None):
    if summarizer_fn:
        summary_result = summarizer_fn(collection, call_llm_fn, show_progress=False)
        final_summary = summary_result.get("final_summary", "")
    else:
        try:
            all_chunks = get_all_chunks_from_collection(collection)
            final_summary = "\n".join(c["text"][:1500] for c in all_chunks)[:6000]
        except NameError:
             final_summary = "Error: Could not retrieve text for quiz."

    mcqs = generate_mcqs_from_context(
        final_summary,
        n_questions=n_questions,
        call_llm_fn=call_llm_fn
    )
    return mcqs