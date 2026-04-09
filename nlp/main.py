from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from nlp_service import analyze_message
from rag_service import answer_with_rag, index_document, create_vector_store, chat_with_groq, load_vector_store
import shutil
import os

# Charger les variables d'environnement
load_dotenv()

# ============================================
# AUTO-INDEX AU DÉMARRAGE
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Indexe automatiquement la base de connaissances au démarrage"""
    print("🚀 FASTO NLP Service démarrage...")
    print("📚 Vérification de la base de connaissances...")

    vector_store = load_vector_store()
    if vector_store is None:
        print("🔄 Première exécution — Indexation de la base de connaissances...")
        result = create_vector_store()
        if result:
            print("✅ Base de connaissances indexée avec succès !")
        else:
            print("⚠️ Aucun document trouvé dans knowledge_base/")
    else:
        print("✅ Base vectorielle déjà existante, chargée.")

    # Compter les fichiers knowledge_base
    kb_path = "knowledge_base/"
    if os.path.exists(kb_path):
        files = [f for f in os.listdir(kb_path) if f.endswith(('.txt', '.pdf', '.docx'))]
        print(f"📂 {len(files)} fichiers dans la base de connaissances : {', '.join(files)}")

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        print(f"🔑 Clé Groq API configurée ({groq_key[:10]}...)")
    else:
        print("❌ ATTENTION : GROQ_API_KEY non configurée !")

    print("✅ FASTO est prêt ! 🤖")
    yield
    print("👋 FASTO arrêté.")

app = FastAPI(
    title="FASTO — Faculty Assistant & Smart Technology Oracle",
    description="Service NLP + RAG + Groq pour la gestion de faculté privée",
    version="2.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8080", "http://localhost:61748", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageRequest(BaseModel):
    message: str
    language: str = "fr"

class RagRequest(BaseModel):
    question: str
    language: str = "fr"

class GroqChatRequest(BaseModel):
    message: str
    language: str = "fr"
    student_context: Optional[dict] = None

# ============================================
# ROUTE PRINCIPALE NLP
# ============================================
@app.post("/analyze")
async def analyze(request: MessageRequest):
    result = analyze_message(request.message, request.language)
    return result

# ============================================
# ROUTE RAG — QUESTION SUR LES DOCUMENTS
# ============================================
@app.post("/rag/ask")
async def ask_rag(request: RagRequest):
    result = answer_with_rag(request.question, request.language)
    return result

# ============================================
# ROUTE GROQ — CHAT DIRECT AVEC IA
# ============================================
@app.post("/groq/chat")
async def groq_chat(request: GroqChatRequest):
    """Chat direct avec FASTO via Groq pour les questions générales"""
    enriched_message = request.message

    if request.student_context:
        ctx = request.student_context
        context_parts = []
        if ctx.get('firstName'):
            context_parts.append(f"Prénom: {ctx['firstName']}")
        if ctx.get('lastName'):
            context_parts.append(f"Nom: {ctx['lastName']}")
        if ctx.get('fieldOfStudy'):
            context_parts.append(f"Filière: {ctx['fieldOfStudy']}")
        if ctx.get('academicLevel'):
            context_parts.append(f"Niveau: {ctx['academicLevel']}")
        if ctx.get('studentId'):
            context_parts.append(f"N° étudiant: {ctx['studentId']}")

        if context_parts:
            context_info = "\n[Contexte étudiant: " + ", ".join(context_parts) + "]\n\n"
            enriched_message = context_info + "Question: " + request.message

    result = chat_with_groq(enriched_message, request.language)
    return result

# ============================================
# ROUTE UPLOAD DOCUMENT
# ============================================
@app.post("/rag/upload")
async def upload_document(file: UploadFile = File(...)):
    upload_dir = "knowledge_base/"
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, file.filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    success = index_document(filepath)

    if success:
        return {
            "message": f"✅ Document '{file.filename}' indexé avec succès dans FASTO",
            "status": "success"
        }
    else:
        return {
            "message": "❌ Erreur lors de l'indexation du document",
            "status": "error"
        }

# ============================================
# ROUTE RÉINDEXER TOUS LES DOCUMENTS
# ============================================
@app.post("/rag/index")
async def index_all():
    """Force la réindexation complète de la base de connaissances"""
    # Supprimer l'ancienne base vectorielle
    import shutil as sh
    chroma_dir = "chroma_db/"
    if os.path.exists(chroma_dir):
        sh.rmtree(chroma_dir)
        print("🗑️ Ancienne base vectorielle supprimée")

    vector_store = create_vector_store()
    if vector_store:
        return {
            "message": "✅ Base de connaissances FASTO recréée avec succès !",
            "status": "success"
        }
    return {
        "message": "⚠️ Aucun document trouvé dans knowledge_base/",
        "status": "empty"
    }

# ============================================
# ROUTE STATUS RAG
# ============================================
@app.get("/rag/status")
async def rag_status():
    """Vérifie l'état complet du service FASTO"""
    from rag_service import GROQ_API_KEY

    has_vector_store = load_vector_store() is not None
    has_groq_key = GROQ_API_KEY is not None and len(GROQ_API_KEY) > 0

    # Compter les fichiers knowledge_base
    kb_files = []
    kb_path = "knowledge_base/"
    if os.path.exists(kb_path):
        kb_files = [f for f in os.listdir(kb_path) if f.endswith(('.txt', '.pdf', '.docx'))]

    return {
        "assistant_name": "FASTO",
        "version": "2.0",
        "vector_store_ready": has_vector_store,
        "groq_configured": has_groq_key,
        "knowledge_base_files": len(kb_files),
        "files": kb_files,
        "status": "ready" if (has_groq_key and has_vector_store) else
                  "partial" if has_groq_key else "missing_api_key"
    }

# ============================================
# ROUTE DE SANTÉ
# ============================================
@app.get("/health")
async def health():
    return {
        "status": "✅ FASTO (Faculty Assistant & Smart Technology Oracle) is running!",
        "version": "2.0",
        "services": ["NLP", "RAG", "Groq AI"],
        "languages": ["Français", "العربية", "الدارجة التونسية"]
    }
