from datetime import datetime
from rag_engine import smart_search
from conversation_routes import router as conversation_router
import os
import re
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from pydantic import BaseModel
from pypdf import PdfReader
from sqlmodel import Session, select

from auth_routes import router as auth_router
from database import create_db_and_tables, engine
from models import User

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

UPLOAD_DIR = Path("uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)

DOCUMENTS_DIR = Path("documents")
DOCUMENTS_DIR.mkdir(exist_ok=True)

chroma_client = chromadb.PersistentClient(path="chroma_db")
collection = chroma_client.get_or_create_collection(name="professor_documents")

app = FastAPI()

create_db_and_tables()
app.include_router(auth_router)
app.include_router(conversation_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


def split_text(text: str, chunk_size: int = 1800):
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) <= chunk_size:
            current_chunk += "\n\n" + paragraph
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = paragraph

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def extract_text_from_pdf(pdf_path: Path):
    reader = PdfReader(str(pdf_path))
    pages_text = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if text:
            pages_text.append({"page": page_number, "text": text})

    return pages_text, len(reader.pages)


def pages_to_text(pages_data):
    extracted_text = ""

    for page in pages_data:
        extracted_text += f"\n\n[Page {page['page']}]\n{page['text']}"

    return extracted_text


def save_chunks_to_collection(filename: str, extracted_text: str, skip_existing: bool = True):
    chunks = split_text(extracted_text)
    existing_ids = set(collection.get()["ids"]) if skip_existing else set()

    ids = []
    documents = []
    metadatas = []

    for index, chunk in enumerate(chunks):
        chunk_id = f"{filename}-{index}"

        if chunk_id in existing_ids:
            continue

        page_match = re.search(r"\[Page\s+(\d+)\]", chunk)
        page_number = int(page_match.group(1)) if page_match else 0

        ids.append(chunk_id)
        documents.append(chunk)
        metadatas.append(
            {
                "filename": filename,
                "chunk_index": index,
                "page": page_number,
            }
        )

    if documents:
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )

    return len(documents), len(chunks)


def clean_source_name(filename: str):
    name = str(filename)

    try:
        if "\\u" in name:
            name = name.encode("utf-8").decode("unicode_escape")
    except Exception:
        pass

    name = name.replace("\\n", " ")
    name = name.replace("\n", " ")
    name = name.replace(".pdf", "")
    name = name.replace("www.ostad-mosavi.com_articles_", "")
    name = name.replace("www.ostad-mosavi.com", "")
    name = name.replace("articles", "")
    name = name.replace("__", "_")
    name = name.replace("_", " ")
    name = name.replace("-", " ")

    name = re.sub(r"action\s*=?\s*print", "", name, flags=re.IGNORECASE)
    name = re.sub(r"\bprint\b", "", name, flags=re.IGNORECASE)
    name = re.sub(r"\s+", " ", name).strip()
    name = re.sub(r"^\d+\s+", "", name).strip()

    if not name:
        name = "منبعی از آثار استاد"

    lower_name = name.lower().strip()

    if lower_name.startswith("ketabe noq"):
        return "کتاب نقطة الهدایة، از آثار استاد علامه سید علی موسوی(ره)"

    if lower_name.startswith("ketab ") or lower_name.startswith("book ") or name.startswith("کتاب "):
        title = name
        title = re.sub(r"^ketab\s+", "", title, flags=re.IGNORECASE)
        title = re.sub(r"^book\s+", "", title, flags=re.IGNORECASE)
        title = re.sub(r"^کتاب\s+", "", title)
        title = title.replace("Ostad Mousavi", "")
        title = title.replace("ostad mousavi", "")
        title = re.sub(r"\s+", " ", title).strip()

        return f"کتاب {title}، از آثار استاد علامه سید علی موسوی(ره)"

    return f"{name}، مقاله‌ای برگرفته از سایت استاد علامه سید علی موسوی(ره)"


def build_sources_text(sources):
    if not sources:
        return ""

    cleaned_sources = []

    for source in sources[:5]:
        if isinstance(source, dict):
            filename = source.get("filename", "منبع نامشخص")
            page = source.get("page", 0)
        else:
            filename = source
            page = 0

        cleaned = clean_source_name(filename)

        if page:
            cleaned = f"{cleaned}، صفحه {page}"

        if cleaned not in cleaned_sources:
            cleaned_sources.append(cleaned)

    if not cleaned_sources:
        return ""

    text = "\n\n## منابع استفاده‌شده\n\n"

    for item in cleaned_sources:
        text += f"- {item}\n"

    return text


def build_prompt(context: str, question: str):
    return f"""
تو دستیار علمی مؤسسه حکمةٌ صافیه و آثار استاد علامه سید علی موسوی(ره) هستی.

قانون اصلی:
فقط و فقط بر اساس متن‌های استاد که در پایین آمده پاسخ بده.
از دانش عمومی خودت استفاده نکن.
از اینترنت یا اطلاعات خارج از فایل‌ها استفاده نکن.

اگر متن‌های پایین با سؤال کاربر ارتباط دارند، حتماً بر اساس همان‌ها پاسخ بده.
فقط اگر متن‌های پایین واقعاً هیچ ارتباطی با سؤال نداشتند، بنویس:
در منابع موجود استاد، پاسخ مستندی برای این پرسش پیدا نشد.

متن‌های مرتبط از منابع استاد:
{context}

پرسش کاربر:
{question}

شیوه پاسخ:
پاسخ را فارسی، رسمی، روان و مقاله‌ای بنویس.
خروجی را با Markdown استاندارد بنویس.
برای عنوان اصلی از # استفاده کن.
برای تیترهای بخش‌ها از ## استفاده کن.
حتماً مقدمه داشته باشد.
حتماً چند تیتر مناسب و متنوع داشته باشد.
حتماً جمع‌بندی داشته باشد.
"""


@app.get("/")
def home():
    return {
        "message": "ProfessorAI Backend is Running Successfully",
        "gemini_key_loaded": bool(api_key),
    }


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    content = await file.read()
    file_path.write_bytes(content)

    pages_data, pages_count = extract_text_from_pdf(file_path)
    extracted_text = pages_to_text(pages_data)

    chunks_saved, total_chunks = save_chunks_to_collection(
        file.filename,
        extracted_text,
        skip_existing=True,
    )

    return {
        "filename": file.filename,
        "pages": pages_count,
        "chunks_saved": chunks_saved,
        "total_chunks": total_chunks,
        "characters": len(extracted_text),
        "preview": extracted_text[:800],
    }


def get_context_and_sources(question: str):
    documents, metadatas = smart_search(
        collection=collection,
        question=question,
        n_results=18,
    )

    sources = []

    for metadata in metadatas:
        filename = metadata.get("filename", "منبع نامشخص")
        page = metadata.get("page", 0)

        item = {
            "filename": filename,
            "page": page,
        }

        if item not in sources:
            sources.append(item)

    context = "\n\n".join(documents)

    return context, sources, documents


@app.post("/chat")
def chat(request: ChatRequest):
    if not api_key:
        return {"answer": "خطا: کلید Gemini در فایل .env پیدا نشد."}

    context, sources, documents = get_context_and_sources(request.message)

    if not documents:
        return {
            "answer": "هنوز هیچ فایل PDF در پایگاه دانش ثبت نشده است. ابتدا یک PDF آپلود کنید.",
            "sources": [],
        }

    prompt = build_prompt(context, request.message)
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    answer = response.text + build_sources_text(sources)

    return {
        "answer": answer,
        "sources": [clean_source_name(source.get("filename", "")) for source in sources[:5]],
    }


@app.post("/chat-stream")
def chat_stream(request: ChatRequest):
    if not api_key:
        return StreamingResponse(
            iter(["خطا: کلید Gemini در فایل .env پیدا نشد."]),
            media_type="text/plain",
        )

    context, sources, documents = get_context_and_sources(request.message)

    if not documents:
        return StreamingResponse(
            iter(["هنوز هیچ فایل PDF در پایگاه دانش ثبت نشده است. ابتدا منابع را وارد کنید."]),
            media_type="text/plain",
        )

    prompt = build_prompt(context, request.message)
    client = genai.Client(api_key=api_key)

    def generate():
        stream = client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        for chunk in stream:
            if chunk.text:
                yield chunk.text

        yield build_sources_text(sources)

    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/ingest-documents")
def ingest_documents():
    pdf_files = list(DOCUMENTS_DIR.glob("*.pdf"))

    if not pdf_files:
        return {"message": "هیچ فایل PDF داخل پوشه documents پیدا نشد."}

    total_files = 0
    total_chunks_saved = 0
    total_chunks_found = 0

    for pdf_file in pdf_files:
        pages_data, _ = extract_text_from_pdf(pdf_file)
        extracted_text = pages_to_text(pages_data)

        chunks_saved, total_chunks = save_chunks_to_collection(
            pdf_file.name,
            extracted_text,
            skip_existing=True,
        )

        total_files += 1
        total_chunks_saved += chunks_saved
        total_chunks_found += total_chunks

    return {
        "message": "منابع با موفقیت وارد پایگاه اطلاعاتی شدند.",
        "files_processed": total_files,
        "chunks_saved": total_chunks_saved,
        "chunks_found": total_chunks_found,
    }


@app.post("/reset-knowledge-base")
def reset_knowledge_base():
    existing_ids = collection.get()["ids"]

    if existing_ids:
        collection.delete(ids=existing_ids)

    return {
        "message": "پایگاه اطلاعاتی با موفقیت پاک شد.",
        "deleted_chunks": len(existing_ids),
    }


@app.post("/rebuild-knowledge-base")
def rebuild_knowledge_base():
    existing_ids = collection.get()["ids"]

    if existing_ids:
        collection.delete(ids=existing_ids)

    pdf_files = list(DOCUMENTS_DIR.glob("*.pdf"))

    if not pdf_files:
        return {"message": "هیچ فایل PDF داخل پوشه documents پیدا نشد."}

    total_files = 0
    total_chunks_saved = 0

    for pdf_file in pdf_files:
        pages_data, _ = extract_text_from_pdf(pdf_file)
        extracted_text = pages_to_text(pages_data)

        chunks_saved, _ = save_chunks_to_collection(
            pdf_file.name,
            extracted_text,
            skip_existing=False,
        )

        total_files += 1
        total_chunks_saved += chunks_saved

    return {
        "message": "پایگاه اطلاعاتی با موفقیت بازسازی شد.",
        "files_processed": total_files,
        "chunks_saved": total_chunks_saved,
    }


@app.get("/knowledge-base-status")
def knowledge_base_status():
    data = collection.get()

    ids = data.get("ids", [])
    metadatas = data.get("metadatas", [])

    filenames = []

    for metadata in metadatas:
        filename = metadata.get("filename", "منبع نامشخص")
        if filename not in filenames:
            filenames.append(filename)

    return {
        "documents_count": len(filenames),
        "chunks_count": len(ids),
        "files": filenames,
    }


@app.post("/admin/upload-document")
async def admin_upload_document(file: UploadFile = File(...)):
    DOCUMENTS_DIR.mkdir(exist_ok=True)

    file_path = DOCUMENTS_DIR / file.filename
    content = await file.read()
    file_path.write_bytes(content)

    return {
        "message": "فایل با موفقیت آپلود شد.",
        "filename": file.filename,
    }


@app.get("/admin/documents")
def admin_list_documents():
    DOCUMENTS_DIR.mkdir(exist_ok=True)

    files = []

    collection_data = collection.get()
    metadatas = collection_data.get("metadatas", [])

    pdf_files = sorted(
        DOCUMENTS_DIR.glob("*.pdf"),
        key=lambda file: file.stat().st_mtime,
        reverse=True,
    )

    for index, file in enumerate(pdf_files, start=1):
        pages = 0

        try:
            reader = PdfReader(str(file))
            pages = len(reader.pages)
        except Exception:
            pass

        chunks = 0
        for meta in metadatas:
            if meta.get("filename") == file.name:
                chunks += 1

        uploaded_timestamp = file.stat().st_mtime
        uploaded_at = datetime.fromtimestamp(uploaded_timestamp).strftime(
            "%Y/%m/%d - %H:%M"
        )

        files.append(
            {
                "row": index,
                "filename": file.name,
                "display_name": clean_source_name(file.name),
                "size_kb": round(file.stat().st_size / 1024, 2),
                "pages": pages,
                "chunks": chunks,
                "uploaded_at": uploaded_at,
                "uploaded_timestamp": uploaded_timestamp,
                "indexed": chunks > 0,
            }
        )

    return {
        "files_count": len(files),
        "files": files,
    }


@app.delete("/admin/delete-document/{filename}")
def delete_document(filename: str):
    file_path = DOCUMENTS_DIR / filename

    if not file_path.exists():
        return {"message": "فایل پیدا نشد."}

    file_path.unlink()

    data = collection.get(include=["metadatas"])
    ids = data.get("ids", [])
    metadatas = data.get("metadatas", [])

    ids_to_delete = [
        item_id
        for item_id, meta in zip(ids, metadatas)
        if meta.get("filename") == filename
    ]

    if ids_to_delete:
        collection.delete(ids=ids_to_delete)

    return {
        "message": "فایل و بخش‌های قابل جستجوی مربوط به آن با موفقیت حذف شد.",
        "deleted_search_sections": len(ids_to_delete),
    }


@app.get("/admin/dashboard")
def admin_dashboard():
    files = list(DOCUMENTS_DIR.glob("*.pdf"))

    collection_data = collection.get()
    chunks = collection_data.get("ids", [])

    with Session(engine) as session:
        users_count = len(session.exec(select(User)).all())

    return {
        "users": users_count,
        "documents": len(files),
        "chunks": len(chunks),
        "knowledge_ready": len(chunks) > 0,
    }


@app.get("/admin/users")
def admin_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()

    return {
        "users": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_admin": user.is_admin,
                "is_active": user.is_active,
            }
            for user in users
        ]
    }
