import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile",
        temperature=0.25,
        max_tokens=100
    )
    from langchain_core.messages import HumanMessage
    response = llm.invoke([HumanMessage(content="Bonjour")])
    print("SUCCESS:", response.content)
except Exception as e:
    print("FAILURE:", str(e))
