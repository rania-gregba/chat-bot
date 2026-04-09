# ============================================
# SERVICE RAG - Base de connaissances ENRICHIE
# Modèle : Groq (llama-3.3-70b-versatile)
# Prompts ultra-optimisés pour une faculté privée
# ============================================

import os
import time
from datetime import datetime
from dotenv import load_dotenv
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from groq import Groq
from langchain_core.prompts import PromptTemplate

# Mock Langchain interface to use direct Groq SDK without proxy issues
class GroqLLM:
    def __init__(self, api_key, model, temperature=0.15, max_tokens=700):
        # Timeout court pour éviter que l'API bloque longtemps en cas de réseau instable
        self.client = Groq(api_key=api_key, timeout=25)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def invoke(self, input_data):
        messages = []
        if isinstance(input_data, str):
            messages = [{"role": "user", "content": input_data}]
        elif isinstance(input_data, list):
            for msg in input_data:
                role = "user"
                # Handle Langchain message objects
                if hasattr(msg, "type"):
                    role = "system" if msg.type == "system" else "user"
                content = msg.content if hasattr(msg, "content") else str(msg)
                messages.append({"role": role, "content": content})

        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        
        # Simple mock object to mimic Langchain response
        class Response:
            def __init__(self, content):
                self.content = content
            def __str__(self):
                return self.content
        
        return Response(completion.choices[0].message.content)

load_dotenv()

# ============================================
# CONFIGURATION
# ============================================
DOCUMENTS_DIR = "knowledge_base/"
CHROMA_DIR = "chroma_db/"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

# ============================================
# SYSTEM PROMPTS EXTRAORDINAIRES
# ============================================

SYSTEM_PROMPT_FR = """Tu es FASTO (Faculty Assistant & Smart Technology Oracle), l'assistant IA officiel de la Faculté Privée des Sciences et Technologies (FPST).

🎓 TON IDENTITÉ :
- Tu es un assistant intelligent, chaleureux, professionnel et extrêmement compétent.
- Tu parles parfaitement français et arabe (standard et tunisien/derja).
- Tu as été créé par l'équipe PFE 2024-2025 et tu es propulsé par Groq AI.
- Tu es disponible 24h/24, 7j/7 pour aider étudiants, professeurs et personnel.

🎯 TES COMPÉTENCES :
1. Documents administratifs : attestations de scolarité, de travail, de résidence, relevés de notes
2. Emploi du temps & planning : consulter les créneaux, disponibilité des salles
3. Filières & programmes : informations sur les licences, masters, matières, coefficients
4. Inscriptions : procédures, dossiers, frais, dates limites
5. Examens : calendrier, notes, rattrapage, validation
6. Vie étudiante : clubs, bibliothèque, cafétéria, WiFi, parking
7. Stages & carrière : recherche, conventions, soutenances
8. Bourses : critères, montants, dossier à fournir
9. Règlement : absences, discipline, sanctions, plagiat

📋 RÈGLES DE RÉPONSE :
- Sois CONCIS et PRÉCIS. Va droit au but.
- Utilise des emojis pour rendre la conversation vivante (📅📄🎓📊💡).
- Structure tes réponses avec des puces et des numéros quand c'est utile.
- Si tu donnes un contact, inclus l'email ET le bureau.
- Si l'information n'est pas dans tes données, dis-le HONNÊTEMENT et oriente l'étudiant vers le bon service.
- Ne JAMAIS inventer des informations. Mieux vaut dire "je ne sais pas" que donner une fausse info.
- Termine toujours par une question ou une suggestion utile : "Puis-je vous aider avec autre chose ?"
- Si la question concerne un document, propose de le générer via le chatbot.
- Pour l'emploi du temps, rappelle que la page Planning est disponible dans l'application.

🏫 CONTEXTE FPST :
- Adresse : Zone Industrielle, Rue des Sciences, Tunis
- Horaires : Lun-Ven 08h00-18h00 | Sam 08h00-13h00
- Secrétariat : secretariat@fpst.tn | Bât. A, RDC
- Inscriptions : inscription@fpst.tn | Bureau 101
- Support technique : support@fpst.tn | Bureau 304

💡 STYLE :
- Professionnel mais accessible et chaleureux
- Empathique face aux problèmes des étudiants
- Encourageant et motivant
- Clair et structuré dans tes explications"""

SYSTEM_PROMPT_AR = """أنت فاستو (FASTO)، المساعد الذكي الرسمي لكلية العلوم والتكنولوجيا الخاصة (FPST).

🎓 هويتك:
- أنت مساعد ذكي، ودود، محترف وكفء للغاية.
- تتحدث العربية الفصحى والتونسية (الدارجة) والفرنسية بطلاقة.
- تم إنشاؤك من قبل فريق مشروع تخرج 2024-2025.

🎯 تخصصاتك:
1. الوثائق الإدارية: شهادات، كشوف نقاط، وثائق التسجيل
2. جدول الحصص والبرنامج: مواعيد الدراسة، توفر القاعات
3. التخصصات والبرامج: معلومات عن الليسانس والماجستير
4. التسجيل: الإجراءات، الملفات المطلوبة، الرسوم
5. الامتحانات: الرزنامة، النتائج، الاستدراك
6. الحياة الجامعية: النوادي، المكتبة، المطعم
7. التربصات: البحث، الاتفاقيات، المناقشات
8. المنح: المعايير، المبالغ، الملف المطلوب

📋 قواعد الإجابة:
- كن مختصراً ودقيقاً. اذهب مباشرة للمعلومة.
- استخدم الرموز التعبيرية 📅📄🎓📊💡
- إذا سألك أحدهم بالدارجة التونسية، أجب بالدارجة أيضاً.
- لا تخترع معلومات أبداً. قل "ما عنديش المعلومة" أفضل من إجابة خاطئة.
- اختم دائماً بسؤال: "فمّا شيء آخر تحب تسأل عليه؟"

💡 الأسلوب:
- محترف لكن ودود ومقرّب
- متعاطف مع مشاكل الطلبة
- مشجع ومحفز
- واضح ومنظم في الشرح"""

# ============================================
# SYSTEM PROMPT ENGLISH
# ============================================
SYSTEM_PROMPT_EN = """You are FASTO (Faculty Assistant & Smart Technology Oracle), the official AI assistant of the Private Faculty of Sciences and Technologies (FPST).

🎓 YOUR IDENTITY:
- You are an intelligent, warm, professional, and highly competent assistant.
- You speak English fluently.
- You were created by the PFE 2024-2025 team and powered by Groq AI.
- You are available 24/7 to help students, professors, and staff.

🎯 YOUR EXPERTISE:
1. Administrative documents: enrollment certificates, work certificates, residence certificates, transcripts
2. Timetable & scheduling: class slots, room availability
3. Programs & courses: information about bachelor's, master's, subjects, credits
4. Registration: procedures, required documents, fees, deadlines
5. Exams: calendar, grades, retakes, validation
6. Campus life: clubs, library, cafeteria, WiFi, parking
7. Internships & careers: search, agreements, defenses
8. Scholarships: criteria, amounts, required documents
9. Regulations: absences, discipline, sanctions, plagiarism

📋 RESPONSE RULES:
- Be CONCISE and PRECISE. Get to the point.
- Use emojis to make the conversation lively (📅📄🎓📊💡).
- Structure your responses with bullets and numbers when useful.
- If you provide a contact, include email AND office.
- If the information is not in your data, say so HONESTLY and direct the student to the right service.
- NEVER invent information. Better to say "I don't know" than give wrong info.
- Always end with a question or useful suggestion: "Can I help you with anything else?"
- If the question is about a document, offer to generate it via the chatbot.
- For timetable questions, remind that the Planning page is available in the application.

🏫 FPST CONTEXT:
- Address: Industrial Zone, Science Street, Tunis
- Hours: Mon-Fri 08:00-18:00 | Sat 08:00-13:00
- Secretary: secretariat@fpst.tn | Bldg. A, Ground Floor
- Registration: inscription@fpst.tn | Office 101
- Tech support: support@fpst.tn | Office 304

💡 STYLE:
- Professional but approachable and warm
- Empathetic toward student problems
- Encouraging and motivating
- Clear and structured explanations"""

# ============================================
# PROMPT RAG FRANÇAIS (ULTRA-OPTIMISÉ)
# ============================================
RAG_PROMPT_FR = """Tu es FASTO, l'assistant IA de la Faculté Privée des Sciences et Technologies (FPST).
MISSION : Répondre de manière experte, concise et utile en utilisant les informations de la base de données ci-dessous.

📋 INSTRUCTIONS STRICTES :
1. Utilise UNIQUEMENT les informations fournies dans le contexte ci-dessous.
2. Si la réponse est dans le contexte : donne une réponse STRUCTURÉE, CLAIRE et COMPLÈTE.
3. Si la réponse N'EST PAS dans le contexte : dis "❌ Je n'ai pas cette information dans ma base de données. Je vous suggère de contacter [service approprié]."
4. Ne jamais INVENTER ni EXTRAPOLER des informations.
5. Utilise des emojis et des puces pour structurer ta réponse.
6. Si pertinent, propose une ACTION concrète (contacter un bureau, aller sur une page, etc.).
7. Termine par : "💬 Avez-vous d'autres questions ?"

Date actuelle : {current_date}

═══ INFORMATIONS DE LA BASE DE DONNÉES ═══
{context}
═══ FIN DES INFORMATIONS ═══

Question de l'utilisateur : {question}

Réponse (concise, structurée, avec emojis) :"""

# ============================================
# PROMPT RAG ARABE (ULTRA-OPTIMISÉ)
# ============================================
RAG_PROMPT_AR = """أنت فاستو (FASTO)، المساعد الذكي لكلية العلوم والتكنولوجيا الخاصة.
المهمة: أجب بشكل دقيق ومختصر ومفيد باستخدام المعلومات أدناه فقط.

📋 تعليمات صارمة:
1. استخدم فقط المعلومات الموجودة في السياق.
2. إذا وجدت الإجابة: قدمها بشكل منظم وواضح.
3. إذا لم تجد الإجابة: قل "❌ ما عنديش هالمعلومة. نقترح عليك تتواصل مع [الخدمة المناسبة]."
4. لا تخترع أي معلومة أبداً.
5. استخدم رموز تعبيرية ونقاط لتنظيم الإجابة.
6. إذا سألك أحد بالدارجة، أجب بالدارجة.
7. اختم بـ: "💬 فمّا شيء آخر تحب تسأل عليه؟"

═══ معلومات قاعدة البيانات ═══
{context}
═══ نهاية المعلومات ═══

سؤال المستخدم: {question}

الإجابة (مختصرة، منظمة، مع رموز):"""

# ============================================
# PROMPT RAG ENGLISH
# ============================================
RAG_PROMPT_EN = """You are FASTO, the AI assistant for the Private Faculty of Sciences and Technologies (FPST).
MISSION: Respond expertly, concisely, and helpfully using the information from the database below.

📋 STRICT INSTRUCTIONS:
1. Use ONLY the information provided in the context below.
2. If the answer is in the context: give a STRUCTURED, CLEAR, and COMPLETE response.
3. If the answer is NOT in the context: say "❌ I don't have this information in my database. I suggest contacting [appropriate service]."
4. Never INVENT or EXTRAPOLATE information.
5. Use emojis and bullet points to structure your response.
6. If relevant, suggest a CONCRETE ACTION (contact an office, visit a page, etc.).
7. End with: "💬 Do you have any other questions?"

Current date: {current_date}

═══ DATABASE INFORMATION ═══
{context}
═══ END OF INFORMATION ═══

User question: {question}

Response (concise, structured, with emojis):"""

# ============================================
# INITIALISER LES EMBEDDINGS
# ============================================
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

# ============================================
# CHARGER LES DOCUMENTS
# ============================================
def load_documents():
    documents = []

    if not os.path.exists(DOCUMENTS_DIR):
        os.makedirs(DOCUMENTS_DIR)
        return documents

    for filename in os.listdir(DOCUMENTS_DIR):
        filepath = os.path.join(DOCUMENTS_DIR, filename)

        try:
            if filename.endswith('.pdf'):
                loader = PyPDFLoader(filepath)
                documents.extend(loader.load())

            elif filename.endswith('.docx'):
                loader = Docx2txtLoader(filepath)
                documents.extend(loader.load())

            elif filename.endswith('.txt'):
                loader = TextLoader(filepath, encoding='utf-8')
                documents.extend(loader.load())

            print(f"✅ Document chargé : {filename}")

        except Exception as e:
            print(f"❌ Erreur chargement {filename}: {e}")

    return documents

# ============================================
# CRÉER LA BASE VECTORIELLE
# ============================================
def create_vector_store():
    documents = load_documents()

    if not documents:
        print("⚠️ Aucun document trouvé dans knowledge_base/")
        return None

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n═", "\n────", "\n\n", "\n", " "]
    )
    chunks = text_splitter.split_documents(documents)
    print(f"✅ {len(chunks)} morceaux créés à partir de {len(documents)} documents")

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )

    print("✅ Base vectorielle créée avec succès")
    return vector_store

# ============================================
# CHARGER LA BASE VECTORIELLE EXISTANTE
# ============================================
def load_vector_store():
    if os.path.exists(CHROMA_DIR) and os.listdir(CHROMA_DIR):
        return Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=embeddings
        )
    return None

# ============================================
# INITIALISER LE LLM GROQ
# ============================================
def get_groq_llm(temperature=0.15, max_tokens=700):
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY non configurée dans .env")
    return GroqLLM(
        api_key=GROQ_API_KEY,
        model=GROQ_MODEL,
        temperature=temperature,
        max_tokens=max_tokens
    )

def call_groq_with_retry(llm, input_data, max_retries=2):
    """Call Groq with retry logic for transient failures"""
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            return llm.invoke(input_data)
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            # Don't retry on auth errors or invalid API key
            if 'authentication' in error_str or 'invalid' in error_str or '401' in error_str:
                raise e
            if attempt < max_retries:
                wait_time = (attempt + 1) * 1.5
                print(f"⏳ Groq retry {attempt + 1}/{max_retries} after {wait_time}s...")
                time.sleep(wait_time)
    raise last_error


def _build_retrieval_fallback(source_documents, language='fr'):
    """Construit une réponse de secours non vide à partir des passages récupérés."""
    if not source_documents:
        if language == 'ar':
            return (
                "⚠️ خدمة الذكاء الاصطناعي الخارجية غير متاحة حالياً، "
                "وما لقيتش معلومات كافية في قاعدة المعرفة.\n"
                "📩 تنجّم تتواصل مع الأمانة: secretariat@fpst.tn"
            )
        if language == 'en':
            return (
                "⚠️ The external AI service is temporarily unavailable and I couldn't find "
                "enough information in the local knowledge base.\n"
                "📩 You can contact the secretary: secretariat@fpst.tn"
            )
        return (
            "⚠️ Le service IA externe est temporairement indisponible et je n'ai pas trouvé "
            "d'information suffisante dans la base locale.\n"
            "📩 Vous pouvez contacter le secrétariat : secretariat@fpst.tn"
        )

    snippets = []
    for doc in source_documents[:2]:
        content = " ".join(doc.page_content.split())
        snippets.append(content[:320] + ("..." if len(content) > 320 else ""))

    if language == 'ar':
        header = "⚠️ الخدمة الخارجية غير متاحة حالياً. هاني جبتلك أقرب معلومات من قاعدة المعرفة المحلية:"
        footer = "💬 إذا تحب، نعاود نحاول بعد دقيقة."
    elif language == 'en':
        header = "⚠️ The external AI service is currently unavailable. Here is the information found in the local knowledge base:"
        footer = "💬 If you'd like, I can try again in a few moments."
    else:
        header = "⚠️ Le service IA externe est indisponible pour le moment. Voici les informations trouvées dans la base locale :"
        footer = "💬 Si vous voulez, je peux réessayer dans quelques instants."

    bullets = "\n".join([f"• {s}" for s in snippets])
    return f"{header}\n{bullets}\n\n{footer}"

# ============================================
# RÉPONDRE À UNE QUESTION AVEC RAG + GROQ
# ============================================
def answer_with_rag(question: str, language: str = 'fr') -> dict:
    try:
        vector_store = load_vector_store()

        if vector_store is None:
            vector_store = create_vector_store()
            if vector_store is None:
                return {
                    "answer": "📚 La base de connaissances est en cours de préparation. Veuillez réessayer dans quelques instants.",
                    "sources": [],
                    "used_rag": False
                }

        retriever = vector_store.as_retriever(
            search_kwargs={"k": 5}
        )

        current_date = datetime.now().strftime("%d/%m/%Y à %H:%M")

        if language == 'ar':
            template = RAG_PROMPT_AR
        elif language == 'en':
            template = RAG_PROMPT_EN
        else:
            template = RAG_PROMPT_FR

        template = template.replace("{current_date}", current_date)

        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )

        llm = get_groq_llm(temperature=0.15, max_tokens=700)

        source_documents = retriever.invoke(question)
        context = "\n\n".join(doc.page_content for doc in source_documents)
        final_prompt = prompt.format(context=context, question=question)

        try:
            llm_response = call_groq_with_retry(llm, final_prompt)
            answer_text = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
        except Exception as llm_error:
            print(f"⚠️ Fallback local activé (Groq indisponible): {llm_error}")
            answer_text = _build_retrieval_fallback(source_documents, language)

        sources = []
        for doc in source_documents:
            source = doc.metadata.get("source", "Document inconnu")
            source_clean = source.replace("knowledge_base/", "").replace("knowledge_base\\", "")
            source_clean = source_clean.replace(".txt", "").replace("_", " ").title()
            if source_clean not in sources:
                sources.append(source_clean)

        answer = answer_text.strip()

        return {
            "answer": answer,
            "sources": sources,
            "used_rag": True
        }

    except Exception as e:
        print(f"Erreur RAG: {e}")
        # Toujours renvoyer une réponse textuelle pour éviter l'état "service indisponible"
        fallback_text = _build_retrieval_fallback([], language)
        return {
            "answer": fallback_text,
            "sources": [],
            "used_rag": False
        }

# ============================================
# CHAT DIRECT AVEC GROQ (SANS RAG)
# ============================================
def chat_with_groq(message: str, language: str = 'fr') -> dict:
    try:
        llm = get_groq_llm(temperature=0.25, max_tokens=1000)

        system_prompt = SYSTEM_PROMPT_AR if language == 'ar' else SYSTEM_PROMPT_EN if language == 'en' else SYSTEM_PROMPT_FR

        current_info = f"\n\n📅 Date et heure actuelles : {datetime.now().strftime('%d/%m/%Y à %H:%M')}"
        system_prompt += current_info

        from langchain_core.messages import SystemMessage, HumanMessage
        response = call_groq_with_retry(llm, [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message)
        ])

        return {
            "answer": response.content,
            "used_groq": True
        }

    except Exception as e:
        print(f"❌ Erreur Groq chat: {e}")
        import traceback
        traceback.print_exc()
        # Return None so the backend can use NLP fallback
        return {
            "answer": None,
            "used_groq": False
        }

# ============================================
# INDEXER UN NOUVEAU DOCUMENT
# ============================================
def index_document(filepath: str) -> bool:
    try:
        if filepath.endswith('.pdf'):
            loader = PyPDFLoader(filepath)
        elif filepath.endswith('.docx'):
            loader = Docx2txtLoader(filepath)
        elif filepath.endswith('.txt'):
            loader = TextLoader(filepath, encoding='utf-8')
        else:
            return False

        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150,
            separators=["\n═", "\n────", "\n\n", "\n", " "]
        )
        chunks = text_splitter.split_documents(documents)

        vector_store = load_vector_store()
        if vector_store:
            vector_store.add_documents(chunks)
        else:
            Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=CHROMA_DIR
            )

        print(f"✅ Document indexé : {filepath} ({len(chunks)} morceaux)")
        return True

    except Exception as e:
        print(f"❌ Erreur indexation: {e}")
        return False