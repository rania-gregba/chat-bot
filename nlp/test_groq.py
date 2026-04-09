import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    client = Groq(api_key=GROQ_API_KEY)
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Bonjour"}],
        temperature=0.25,
        max_tokens=100
    )
    print("SUCCESS:", completion.choices[0].message.content)
except Exception as e:
    print("FAILURE:", str(e))
