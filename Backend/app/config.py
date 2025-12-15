import os
from dotenv import load_dotenv
from openai import OpenAI

# Load variables from .env file immediately
load_dotenv()

API_KEY = os.environ.get("GROQ_API_KEY")
if not API_KEY:
    raise RuntimeError("GROQ_API_KEY must be set in the environment before calling call_llm_summarize()")

# Initialize the client
llm_client = OpenAI(api_key=API_KEY, base_url="https://api.groq.com/openai/v1")