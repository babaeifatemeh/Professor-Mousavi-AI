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
from fastapi.responses import Response, StreamingResponse
from google import genai
from pydantic import BaseModel
from pypdf import PdfReader
from sqlmodel import Session, select, delete

from auth_routes import router as auth_router
from database import create_db_and_tables, engine
from models import User, Conversation, Message, DocumentFile
from document_export import create_word_document

load_dotenv()

api_keys = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]

api_keys = [key.strip() for key in api_keys if key and key.strip()]

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
        "https://professor-mousavi-ai.vercel.app",
        "https://professor-mousavi-5e9kcxbmp-fatemehhbabaeii6-6689s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ExportDocumentRequest(BaseModel):
    title: str = "مقاله پژوهشی"
    content: str


def split_text(text: str, chunk_size: int = 1200, overlap: int = 250):
    """Split text into reliable searchable chunks with overlap."""
    text = re.sub(r"\s+", " ", str(text or "")).strip()

    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(end - overlap, start + 1)

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


def get_existing_chunk_ids_for_file(filename: str):
    data = collection.get(include=["metadatas"])
    ids = data.get("ids", [])
    metadatas = data.get("metadatas", [])

    return [
        item_id
        for item_id, metadata in zip(ids, metadatas)
        if metadata.get("filename") == filename
    ]


def delete_chunks_for_file(filename: str):
    ids_to_delete = get_existing_chunk_ids_for_file(filename)

    if ids_to_delete:
        collection.delete(ids=ids_to_delete)

    return len(ids_to_delete)


def extract_page_blocks(extracted_text: str):
    """Return [(page_number, page_text), ...] from the [Page N] format."""
    text = str(extracted_text or "")
    pattern = re.compile(r"\[Page\s+(\d+)\]\s*")
    matches = list(pattern.finditer(text))

    if not matches:
        return [(0, text)] if text.strip() else []

    pages = []

    for index, match in enumerate(matches):
        page_number = int(match.group(1))
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        page_text = text[start:end].strip()

        if page_text:
            pages.append((page_number, page_text))

    return pages


def save_chunks_to_collection(filename: str, extracted_text: str, skip_existing: bool = True):
    page_blocks = extract_page_blocks(extracted_text)
    existing_ids = set(collection.get()["ids"]) if skip_existing else set()

    ids = []
    documents = []
    metadatas = []
    total_chunks = 0

    for page_number, page_text in page_blocks:
        page_chunks = split_text(page_text, chunk_size=1200, overlap=250)
        total_chunks += len(page_chunks)

        for chunk_index, chunk in enumerate(page_chunks):
            chunk_id = f"{filename}-page-{page_number}-chunk-{chunk_index}"

            if chunk_id in existing_ids:
                continue

            searchable_chunk = (
                f"نام فایل: {filename}\n"
                f"صفحه: {page_number}\n"
                f"متن:\n{chunk}"
            )

            ids.append(chunk_id)
            documents.append(searchable_chunk)
            metadatas.append(
                {
                    "filename": filename,
                    "chunk_index": chunk_index,
                    "page": page_number,
                }
            )

    if documents:
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )

    return len(documents), total_chunks


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

    for source in sources[:20]:
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

قانون قطعی امانت:
- فقط بر اساس «متن‌های مرتبط از منابع استاد» پاسخ بده.
- اگر یک عبارت، جمله، کلمه، صفحه یا عنوان منبع در متن‌های پایین آمده، آن را نادیده نگیر.
- اگر کاربر پرسیده «در کدام فایل/صفحه آمده؟»، اول نام منبع‌ها و صفحه‌ها را مرتب فهرست کن و سپس توضیح کوتاه بده.
- اگر کاربر فقط یک کلمه یا عبارت داده، تمام موارد مرتبط موجود در متن‌های بازیابی‌شده را دسته‌بندی کن.
- اگر کاربر مقاله خواسته، از متن‌های بازیابی‌شده مقاله‌ای منسجم، رسمی و مستند بنویس.
- اگر پاسخ دقیق در متن‌ها هست، هرگز ننویس «پاسخ مستندی پیدا نشد».
- فقط زمانی بنویس «در منابع موجود استاد، پاسخ مستندی برای این پرسش پیدا نشد» که واقعاً هیچ نشانه مرتبطی در متن‌های پایین وجود نداشته باشد.

شیوه پاسخ:
- فارسی، رسمی، روان و دقیق بنویس.
- فقط برای پرسش‌های صریحِ یافتن فایل، صفحه یا عبارت، از ساختار جستجویی استفاده کن.
- برای مقاله، هرگز عنوان‌هایی مانند «نتیجه جستجو» یا «عبارت یافت‌شده» ننویس؛ مستقیماً با عنوان مقاله و مقدمه آغاز کن.
- برای پاسخ‌های مقاله‌ای، مقدمه، تیترهای منظم و جمع‌بندی داشته باش.
- اگر عبارت عیناً در متن آمده، همان عبارت را کوتاه و دقیق نقل کن.
- منبع و صفحه را داخل متن بی‌رویه تکرار نکن؛ سامانه در پایان منابع را اضافه می‌کند.
- بخش «منابع استفاده‌شده» را خودت ننویس.
- هر بخش از متن‌های ورودی دارای شناسه‌ای مانند SOURCE_ID: S1 است.
- فقط از همان شناسه‌هایی استفاده کن که واقعاً مبنای پاسخ نهایی بوده‌اند.
- در آخرین خط پاسخ، دقیقاً و فقط به این شکل شناسه‌های استفاده‌شده را بنویس:
USED_SOURCE_IDS: S1,S3
- اگر هیچ منبعی واقعاً استفاده نشد، بنویس:
USED_SOURCE_IDS: NONE
- این خط فنی برای سامانه است و نباید درباره آن توضیح بدهی.

متن‌های مرتبط از منابع استاد:
{context}

پرسش کاربر:
{question}
"""


@app.post("/export-word")
def export_word(request: ExportDocumentRequest):
    if not request.content.strip():
        return Response(
            content="متن مقاله برای ساخت فایل Word خالی است.",
            status_code=400,
            media_type="text/plain; charset=utf-8",
        )

    document_bytes = create_word_document(
        title=request.title,
        markdown_content=request.content,
    )

    safe_filename = re.sub(r"[^A-Za-z0-9_-]+", "-", request.title).strip("-")
    if not safe_filename:
        safe_filename = "ProfessorAI-article"

    return Response(
        content=document_bytes,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{safe_filename[:80]}.docx"'
            ),
            "Cache-Control": "no-store",
        },
    )


@app.get("/")
def home():
    return {
        "message": "ProfessorAI Backend is Running Successfully",
        "gemini_key_loaded": bool(api_keys),
    }


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    content = await file.read()
    file_path.write_bytes(content)

    pages_data, pages_count = extract_text_from_pdf(file_path)
    extracted_text = pages_to_text(pages_data)

    delete_chunks_for_file(file.filename)
    chunks_saved, total_chunks = save_chunks_to_collection(
        file.filename,
        extracted_text,
        skip_existing=False,
    )

    return {
        "filename": file.filename,
        "pages": pages_count,
        "chunks_saved": chunks_saved,
        "total_chunks": total_chunks,
        "characters": len(extracted_text),
        "preview": extracted_text[:800],
    }



def normalize_persian_text(value: str):
    text = str(value or "")
    replacements = {
        "ي": "ی",
        "ك": "ک",
        "ۀ": "ه",
        "ة": "ه",
        "ؤ": "و",
        "إ": "ا",
        "أ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ى": "ی",
        "‌": " ",
        "\u200c": " ",
        "\u200f": " ",
        "\u200e": " ",
    }

    for old, new_char in replacements.items():
        text = text.replace(old, new_char)

    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
    text = re.sub(r"[^\w\s\u0600-\u06FF]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_search_terms(question: str):
    normalized = normalize_persian_text(question)

    stop_words = {
        "در", "از", "به", "با", "که", "را", "و", "یا", "این", "آن", "برای",
        "کدام", "منبع", "استاد", "گفتند", "گفته", "آمده", "است", "هست",
        "صفحه", "جلد", "کتاب", "فایل", "نقل", "کن", "چی", "چه", "مطلب",
        "موجود", "درباره", "توی", "داخل", "عبارت",
    }

    words = [
        word
        for word in normalized.split()
        if len(word) >= 3 and word not in stop_words and not word.isdigit()
    ]

    phrases = []

    quoted_phrases = re.findall(r'[«"]([^»"]+)[»"]', question)
    for phrase in quoted_phrases:
        phrase = normalize_persian_text(phrase)
        if phrase:
            phrases.append(phrase)

    for size in (4, 3, 2):
        for index in range(0, max(len(words) - size + 1, 0)):
            phrase = " ".join(words[index:index + size])
            if phrase and phrase not in phrases:
                phrases.append(phrase)

    return words, phrases


def extract_requested_page(question: str):
    normalized = normalize_persian_text(question)
    match = re.search(r"صفحه\s+(\d+)", normalized)
    if match:
        return int(match.group(1))
    return None


def exact_keyword_search(question: str, max_results: int = 40):
    words, phrases = extract_search_terms(question)
    requested_page = extract_requested_page(question)

    if not words and not phrases and requested_page is None:
        return []

    data = collection.get(include=["documents", "metadatas"])
    ids = data.get("ids", [])
    documents = data.get("documents", [])
    metadatas = data.get("metadatas", [])

    matches = []

    for item_id, document, metadata in zip(ids, documents, metadatas):
        filename = metadata.get("filename", "")
        page = metadata.get("page", 0)

        document_normalized = normalize_persian_text(document)
        filename_normalized = normalize_persian_text(filename)

        score = 0

        for phrase in phrases:
            if phrase and phrase in document_normalized:
                score += 80 + len(phrase)
            if phrase and phrase in filename_normalized:
                score += 120 + len(phrase)

        for word in words:
            if word in document_normalized:
                score += 15
            if word in filename_normalized:
                score += 80

        if requested_page is not None:
            try:
                page_number = int(page or 0)
            except Exception:
                page_number = 0

            if page_number == requested_page:
                score += 150
            elif abs(page_number - requested_page) <= 1:
                score += 50

        if score > 0:
            matches.append(
                {
                    "id": item_id,
                    "document": document,
                    "metadata": metadata,
                    "score": score,
                }
            )

    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:max_results]



def classify_query_intent(question: str):
    """Classify the user request so exact lookup and article writing do not mix."""
    q = normalize_persian_text(question)

    article_markers = [
        "مقاله", "متن", "بنویس", "بنویسید", "تحقیق", "شرح جامع",
        "توضیح کامل", "به صورت مقاله", "یادداشت", "جمع بندی", "جمع‌بندی"
    ]
    lookup_markers = [
        "کدام فایل", "کدام مقاله", "کدام کتاب", "کدام منبع", "کجا", "در کدام",
        "صفحه", "نقل کن", "پیدا کن", "آمده", "ذکر شده", "عبارت", "جمله"
    ]

    if any(marker in q for marker in article_markers):
        return "article"

    if any(marker in q for marker in lookup_markers):
        return "lookup"

    words, phrases = extract_search_terms(question)

    if len(words) <= 5:
        return "exact"

    return "topic"


def item_key(item):
    metadata = item.get("metadata", {})
    return f"{metadata.get('filename', '')}-page-{metadata.get('page', '')}-chunk-{metadata.get('chunk_index', '')}"


def dedupe_items(items):
    unique = {}
    for item in items:
        key = item_key(item)
        if key not in unique or item.get("score", 0) > unique[key].get("score", 0):
            unique[key] = item
    return sorted(unique.values(), key=lambda item: item.get("score", 0), reverse=True)


def strong_exact_matches(question: str, max_results: int = 80):
    """
    Return only chunks that really contain the important phrase/terms.
    This prevents semantic or weak word matches from polluting source lookup answers.
    """
    words, phrases = extract_search_terms(question)
    exact_items = exact_keyword_search(question, max_results=max_results)

    if not exact_items:
        return []

    meaningful_phrases = [phrase for phrase in phrases if len(phrase.split()) >= 2]
    meaningful_words = [word for word in words if len(word) >= 4]

    strong_items = []

    for item in exact_items:
        document = normalize_persian_text(item.get("document", ""))
        filename = normalize_persian_text(item.get("metadata", {}).get("filename", ""))
        haystack = f"{filename} {document}"

        phrase_hit = any(phrase in haystack for phrase in meaningful_phrases)
        word_hits = sum(1 for word in meaningful_words if word in haystack)

        if phrase_hit:
            item["score"] = item.get("score", 0) + 500
            strong_items.append(item)
        elif len(meaningful_words) >= 2 and word_hits >= min(2, len(meaningful_words)):
            item["score"] = item.get("score", 0) + (word_hits * 80)
            strong_items.append(item)
        elif len(meaningful_words) == 1 and word_hits == 1:
            item["score"] = item.get("score", 0) + 40
            strong_items.append(item)

    return dedupe_items(strong_items)[:max_results]


def select_items_for_context(items, max_chunks=18, per_file_limit=4):
    selected_documents = []
    sources = []
    grouped = {}
    source_ids = {}
    next_source_number = 1

    for item in dedupe_items(items):
        document = item.get("document", "")
        metadata = item.get("metadata", {})
        filename = metadata.get("filename", "منبع نامشخص")
        page = metadata.get("page", 0)

        if not document:
            continue

        grouped.setdefault(filename, 0)

        if grouped[filename] >= per_file_limit:
            continue

        grouped[filename] += 1

        source_key = (filename, int(page or 0))
        if source_key not in source_ids:
            source_id = f"S{next_source_number}"
            source_ids[source_key] = source_id
            next_source_number += 1

            sources.append(
                {
                    "source_id": source_id,
                    "filename": filename,
                    "page": page,
                }
            )
        else:
            source_id = source_ids[source_key]

        labeled_document = (
            f"[SOURCE_ID: {source_id}]\n"
            f"[FILENAME: {filename}]\n"
            f"[PAGE: {page}]\n"
            f"{document}"
        )

        selected_documents.append(labeled_document)

        if len(selected_documents) >= max_chunks:
            break

    return "\n\n".join(selected_documents), sources, selected_documents


def extract_used_source_ids(answer_text: str):
    pattern = re.compile(
        r"(?im)^\s*USED_SOURCE_IDS\s*:\s*([A-Za-z0-9_,\-\s]+)\s*$"
    )
    match = pattern.search(answer_text or "")

    if not match:
        return [], (answer_text or "").strip()

    raw_ids = match.group(1).strip()
    clean_answer = pattern.sub("", answer_text or "").strip()

    if raw_ids.upper() == "NONE":
        return [], clean_answer

    used_ids = []
    for source_id in re.split(r"[\s,]+", raw_ids):
        source_id = source_id.strip().upper()
        if re.fullmatch(r"S\d+", source_id) and source_id not in used_ids:
            used_ids.append(source_id)

    return used_ids, clean_answer



INTERNAL_OUTPUT_PATTERNS = (
    r"این\s+(?:سورس|منبع)\s+اشتباه\s+است",
    r"(?:سورس|منبع)\s+اشتباه",
    r"باید\s+تصحیح\s+شود",
    r"نیاز\s+به\s+تصحیح",
    r"تصحیح\s*:",
    r"اصلاح\s+منبع",
    r"منبع\s+باید\s+جایگزین\s+شود",
    r"چانک",
    r"chunk",
    r"candidate",
    r"score",
    r"رتبه(?:‌|\s*)بندی\s+منابع",
)


def sanitize_public_answer(answer_text: str) -> str:
    """
    Remove internal retrieval/debug commentary from the user-facing answer.
    It does not rewrite valid scholarly content; it only drops contaminated
    lines/paragraphs that expose source-correction or ranking instructions.
    """
    value = str(answer_text or "")
    kept_blocks = []

    for block in re.split(r"\n\s*\n", value):
        cleaned = block.strip()
        if not cleaned:
            continue

        normalized = normalize_persian_text(cleaned)
        is_internal = any(
            re.search(pattern, normalized, flags=re.IGNORECASE)
            for pattern in INTERNAL_OUTPUT_PATTERNS
        )

        if not is_internal:
            kept_blocks.append(cleaned)

    result = "\n\n".join(kept_blocks)
    result = re.sub(r"\n{3,}", "\n\n", result).strip()
    return result

def filter_sources_used_in_answer(answer_text: str, candidate_sources):
    answer_text = sanitize_public_answer(answer_text)
    used_ids, clean_answer = extract_used_source_ids(answer_text)

    source_map = {
        str(source.get("source_id", "")).upper(): source
        for source in candidate_sources
        if source.get("source_id")
    }

    filtered_sources = [
        source_map[source_id]
        for source_id in used_ids
        if source_id in source_map
    ]

    if filtered_sources:
        return clean_answer, filtered_sources

    # Safe fallback: only keep sources explicitly named in the generated answer.
    normalized_answer = normalize_persian_text(clean_answer)
    explicit_sources = []

    for source in candidate_sources:
        filename = str(source.get("filename", ""))
        page = int(source.get("page") or 0)

        raw_filename = normalize_persian_text(filename)
        cleaned_filename = normalize_persian_text(clean_source_name(filename))

        filename_mentioned = (
            bool(raw_filename and raw_filename in normalized_answer)
            or bool(cleaned_filename and cleaned_filename in normalized_answer)
        )
        page_mentioned = (
            page == 0
            or f"صفحه {page}" in normalized_answer
            or f"صفحه: {page}" in normalized_answer
        )

        if filename_mentioned and page_mentioned:
            explicit_sources.append(source)

    # It is safer to show no automatic appendix than to claim unrelated sources.
    return clean_answer, explicit_sources



EVIDENCE_MARKERS = (
    "کدام فایل",
    "کدام مقاله",
    "کدام کتاب",
    "کدام منبع",
    "در کدام",
    "کجا آمده",
    "کجا ذکر شده",
    "در چه صفحه",
    "کدام صفحه",
    "صفحه چند",
    "پیدا کن",
    "عبارت را پیدا",
    "جمله را پیدا",
    "عین متن",
    "متن اصلی",
    "نقل کن",
    "نقل قول",
    "نقل‌قول",
    "ذکر شده",
)


def should_use_evidence_mode(question: str) -> bool:
    """
    Evidence Mode is only for explicit source/phrase/page lookup requests.
    General explanations and article requests still go through Gemini.
    """
    normalized = normalize_persian_text(question)

    article_markers = (
        "مقاله",
        "تحقیق",
        "شرح جامع",
        "توضیح کامل",
        "بنویس",
        "بنویسید",
        "تحلیل",
        "بررسی جامع",
    )

    if any(marker in normalized for marker in article_markers):
        return False

    if any(marker in normalized for marker in EVIDENCE_MARKERS):
        return True

    # Quoted text usually means the user wants the exact occurrence.
    if re.search(r'[«"]([^»"]+)[»"]', question or ""):
        return True

    return False


def strip_index_headers(document: str) -> str:
    """
    Remove only internal index labels.
    The source wording itself is not rewritten, summarized, normalized, or corrected.
    """
    value = str(document or "")
    value = re.sub(r"^\s*نام فایل:\s*.*?\n", "", value, count=1)
    value = re.sub(r"^\s*صفحه:\s*\d+\s*\n", "", value, count=1)
    value = re.sub(r"^\s*متن:\s*\n?", "", value, count=1)
    return value.strip()


def build_exact_evidence_response(question: str):
    """
    Return an answer built directly from indexed PDF text without Gemini.
    This prevents the model from joining sentences, removing parentheses,
    or presenting a rewritten sentence as a quotation.
    """
    matches = strong_exact_matches(question, max_results=160)

    if not matches:
        return None, []

    # Keep one best matching chunk per file/page.
    best_by_page = {}

    for item in matches:
        metadata = item.get("metadata", {})
        filename = metadata.get("filename", "منبع نامشخص")
        page = int(metadata.get("page") or 0)
        key = (filename, page)

        if key not in best_by_page or item.get("score", 0) > best_by_page[key].get("score", 0):
            best_by_page[key] = item

    ranked = sorted(
        best_by_page.values(),
        key=lambda item: item.get("score", 0),
        reverse=True,
    )[:20]

    sections = [
        "## نتیجه جستجوی مستند",
        "",
        "متن‌های زیر مستقیماً از متن استخراج‌شدهٔ فایل‌های PDF نمایش داده می‌شوند و توسط هوش مصنوعی بازنویسی نشده‌اند.",
    ]
    sources = []

    for item in ranked:
        metadata = item.get("metadata", {})
        filename = metadata.get("filename", "منبع نامشخص")
        page = int(metadata.get("page") or 0)
        evidence_text = strip_index_headers(item.get("document", ""))

        if not evidence_text:
            continue

        sections.extend(
            [
                "",
                f"### {clean_source_name(filename)}",
                f"**صفحه {page}**" if page else "",
                "",
                "> " + evidence_text.replace("\n", "\n> "),
            ]
        )

        source = {"filename": filename, "page": page}
        if source not in sources:
            sources.append(source)

    if not sources:
        return None, []

    sections.extend(
        [
            "",
            "## منابع استفاده‌شده",
            "",
        ]
    )

    for source in sources:
        label = clean_source_name(source["filename"])
        if source["page"]:
            label += f"، صفحه {source['page']}"
        sections.append(f"- {label}")

    return "\n".join(line for line in sections if line is not None), sources

def get_context_and_sources(question: str):
    collection_data = collection.get()
    total_chunks = len(collection_data.get("ids", []))

    if total_chunks == 0:
        return "", [], []

    intent = classify_query_intent(question)
    search_limit = min(total_chunks, 80)

    # 1) Exact / source lookup mode: do NOT mix weak semantic results.
    # If the user asks where a phrase appears, only real matching chunks are allowed.
    if intent in {"lookup", "exact"}:
        strong_items = strong_exact_matches(question, max_results=100)

        if strong_items:
            return select_items_for_context(
                strong_items,
                max_chunks=20,
                per_file_limit=5,
            )

        # If exact search found nothing, fall back softly to semantic so the user still gets help.
        semantic_documents, semantic_metadatas = smart_search(
            collection=collection,
            question=question,
            n_results=min(search_limit, 20),
        )

        semantic_items = [
            {"document": document, "metadata": metadata, "score": 0}
            for document, metadata in zip(semantic_documents, semantic_metadatas)
        ]

        return select_items_for_context(
            semantic_items,
            max_chunks=10,
            per_file_limit=2,
        )

    # 2) Article / broad topic mode: use exact + semantic, but with source diversity.
    exact_items = strong_exact_matches(question, max_results=60)

    semantic_documents, semantic_metadatas = smart_search(
        collection=collection,
        question=question,
        n_results=search_limit,
    )

    semantic_items = [
        {"document": document, "metadata": metadata, "score": 20}
        for document, metadata in zip(semantic_documents, semantic_metadatas)
    ]

    combined_items = exact_items + semantic_items

    if intent == "article":
        return select_items_for_context(
            combined_items,
            max_chunks=24,
            per_file_limit=4,
        )

    return select_items_for_context(
        combined_items,
        max_chunks=18,
        per_file_limit=3,
    )


@app.post("/chat")
def chat(request: ChatRequest):
    if should_use_evidence_mode(request.message):
        evidence_answer, evidence_sources = build_exact_evidence_response(
            request.message
        )

        if evidence_answer:
            return {
                "answer": evidence_answer,
                "sources": [
                    clean_source_name(source.get("filename", ""))
                    for source in evidence_sources
                ],
            }

    if not api_keys:
        return {"answer": "خطا: کلید Gemini در تنظیمات سرور پیدا نشد."}

    context, sources, documents = get_context_and_sources(request.message)

    if not documents:
        return {
            "answer": "هنوز هیچ فایل PDF در پایگاه دانش ثبت نشده است. ابتدا یک PDF آپلود کنید.",
            "sources": [],
        }

    prompt = build_prompt(context, request.message)

    answer = None

    for key in api_keys:
        try:
            client = genai.Client(api_key=key)

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )

            clean_answer, used_sources = filter_sources_used_in_answer(
                response.text,
                sources,
            )
            answer = clean_answer + build_sources_text(used_sources)
            sources = used_sources
            break

        except Exception as error:
            print(f"Gemini key failed in /chat: {error}")
            continue

    if answer is None:
        answer = (
            "سرویس هوش مصنوعی موقتاً به محدودیت استفاده رسیده است. "
            "لطفاً کمی بعد دوباره تلاش کنید."
        )

    return {
        "answer": answer,
        "sources": [clean_source_name(source.get("filename", "")) for source in sources[:20]],
    }


@app.post("/chat-stream")
def chat_stream(request: ChatRequest):
    if should_use_evidence_mode(request.message):
        evidence_answer, _ = build_exact_evidence_response(request.message)

        if evidence_answer:
            return StreamingResponse(
                iter([evidence_answer]),
                media_type="text/plain",
            )

    if not api_keys:
        return StreamingResponse(
            iter(["خطا: کلید Gemini در تنظیمات سرور پیدا نشد."]),
            media_type="text/plain",
        )

    context, sources, documents = get_context_and_sources(request.message)

    if not documents:
        return StreamingResponse(
            iter(["هنوز هیچ فایل PDF در پایگاه دانش ثبت نشده است. ابتدا منابع را وارد کنید."]),
            media_type="text/plain",
        )

    prompt = build_prompt(context, request.message)

    def generate():
        for key in api_keys:
            try:
                client = genai.Client(api_key=key)

                stream = client.models.generate_content_stream(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )

                answer_parts = []

                for chunk in stream:
                    if chunk.text:
                        answer_parts.append(chunk.text)

                if answer_parts:
                    raw_answer = "".join(answer_parts)
                    clean_answer, used_sources = filter_sources_used_in_answer(
                        raw_answer,
                        sources,
                    )
                    yield clean_answer
                    yield build_sources_text(used_sources)
                    return

            except Exception as error:
                print(f"Gemini key failed in /chat-stream: {error}")
                continue

        yield (
            "سرویس هوش مصنوعی موقتاً به محدودیت استفاده رسیده است. "
            "لطفاً کمی بعد دوباره تلاش کنید."
        )

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
    pdf_files = list(DOCUMENTS_DIR.glob("*.pdf"))

    if not pdf_files:
        return {"message": "هیچ فایل PDF داخل پوشه documents پیدا نشد."}

    existing_ids = collection.get().get("ids", [])
    if existing_ids:
        collection.delete(ids=existing_ids)

    total_files = 0
    total_chunks_saved = 0
    total_chunks_found = 0

    for pdf_file in pdf_files:
        pages_data, _ = extract_text_from_pdf(pdf_file)
        extracted_text = pages_to_text(pages_data)

        chunks_saved, total_chunks = save_chunks_to_collection(
            pdf_file.name,
            extracted_text,
            skip_existing=False,
        )

        total_files += 1
        total_chunks_saved += chunks_saved
        total_chunks_found += total_chunks

    return {
        "message": "پایگاه اطلاعاتی با موفقیت از نو ساخته شد.",
        "files_processed": total_files,
        "chunks_saved": total_chunks_saved,
        "chunks_found": total_chunks_found,
        "deleted_old_chunks": len(existing_ids),
    }


def auto_rebuild_knowledge_base_if_needed():
    try:
        pdf_files = list(DOCUMENTS_DIR.glob("*.pdf"))

        if not pdf_files:
            print("No PDF files found in documents folder for auto rebuild.")
            return

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

        print(
            f"Knowledge base checked successfully: "
            f"{total_files} files, {total_chunks_saved} new chunks saved, "
            f"{total_chunks_found} chunks found."
        )

    except Exception as error:
        print(f"Knowledge base auto rebuild failed: {error}")


def restore_documents_from_database():
    DOCUMENTS_DIR.mkdir(exist_ok=True)

    with Session(engine) as session:
        files = session.exec(select(DocumentFile)).all()

        restored_count = 0

        for stored_file in files:
            file_path = DOCUMENTS_DIR / stored_file.filename

            if not file_path.exists():
                file_path.write_bytes(stored_file.content)
                restored_count += 1

        print(
            f"Restored {restored_count} documents from database "
            f"out of {len(files)} stored documents."
        )


@app.on_event("startup")
def startup_tasks():
    restore_documents_from_database()
    auto_rebuild_knowledge_base_if_needed()


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

    content = await file.read()

    file_path = DOCUMENTS_DIR / file.filename
    file_path.write_bytes(content)

    with Session(engine) as session:
        existing_file = session.exec(
            select(DocumentFile).where(DocumentFile.filename == file.filename)
        ).first()

        if existing_file:
            existing_file.content = content
        else:
            existing_file = DocumentFile(
                filename=file.filename,
                content=content,
            )
            session.add(existing_file)

        session.commit()

    pages_data, pages_count = extract_text_from_pdf(file_path)
    extracted_text = pages_to_text(pages_data)

    deleted_chunks = delete_chunks_for_file(file.filename)
    chunks_saved, total_chunks = save_chunks_to_collection(
        file.filename,
        extracted_text,
        skip_existing=False,
    )

    return {
        "message": "فایل با موفقیت آپلود، ذخیره و وارد پایگاه جستجو شد.",
        "filename": file.filename,
        "pages": pages_count,
        "deleted_old_chunks": deleted_chunks,
        "chunks_saved": chunks_saved,
        "total_chunks": total_chunks,
        "indexed": chunks_saved > 0,
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

    with Session(engine) as session:
        statement = delete(DocumentFile).where(DocumentFile.filename == filename)
        session.exec(statement)
        session.commit()

    return {
        "message": "فایل و بخش‌های قابل جستجوی مربوط به آن با موفقیت حذف شد.",
        "deleted_search_sections": len(ids_to_delete),
    }


@app.get("/admin/dashboard")
def admin_dashboard():
    DOCUMENTS_DIR.mkdir(exist_ok=True)

    pdf_files = list(DOCUMENTS_DIR.glob("*.pdf"))

    collection_data = collection.get()
    chunks = collection_data.get("ids", [])
    metadatas = collection_data.get("metadatas", [])

    total_pages = 0
    total_size_kb = 0
    indexed_files = set()

    for file in pdf_files:
        try:
            total_size_kb += round(file.stat().st_size / 1024, 2)
        except Exception:
            pass

        try:
            reader = PdfReader(str(file))
            total_pages += len(reader.pages)
        except Exception:
            pass

    for meta in metadatas:
        filename = meta.get("filename")
        if filename:
            indexed_files.add(filename)

    with Session(engine) as session:
        users = session.exec(select(User)).all()
        conversations = session.exec(select(Conversation)).all()
        messages = session.exec(select(Message)).all()
        stored_documents = session.exec(select(DocumentFile)).all()

    active_users = len([user for user in users if user.is_active])
    inactive_users = len([user for user in users if not user.is_active])
    admin_users = len([user for user in users if user.is_admin])

    database_documents_size_kb = round(
        sum(len(document.content or b"") for document in stored_documents) / 1024,
        2,
    )

    return {
        "users": len(users),
        "active_users": active_users,
        "inactive_users": inactive_users,
        "admin_users": admin_users,
        "documents": len(pdf_files),
        "stored_documents": len(stored_documents),
        "indexed_documents": len(indexed_files),
        "pages": total_pages,
        "chunks": len(chunks),
        "conversations": len(conversations),
        "messages": len(messages),
        "files_size_kb": round(total_size_kb, 2),
        "database_documents_size_kb": database_documents_size_kb,
        "api_keys": len(api_keys),
        "gemini_ready": bool(api_keys),
        "chroma_ready": True,
        "database_ready": True,
        "knowledge_ready": len(chunks) > 0,
    }



@app.get("/admin/search-test")
def admin_search_test(q: str):
    context, sources, documents = get_context_and_sources(q)

    return {
        "query": q,
        "results_count": len(documents),
        "sources": sources[:20],
        "preview": [doc[:500] for doc in documents[:10]],
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
                "created_at": (
                    user.created_at.strftime("%Y/%m/%d %H:%M")
                    if user.created_at
                    else "-"
                ),
            }
            for user in users
        ]
    }
