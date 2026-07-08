import re

PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
ENGLISH_DIGITS = "0123456789"

STOP_WORDS = {
    "در", "از", "به", "با", "برای", "را", "و", "یا", "که", "این", "آن", "یک",
    "کن", "کنید", "برام", "برایم", "تحقیق", "توضیح", "بده", "بگویید",
    "چیست", "است", "هست", "خصوص", "مورد", "نظر", "استاد", "درباره",
    "راجع", "لطفا", "لطفاً", "میگه", "چی", "استخراج", "کدام", "فایل",
    "مقاله", "کتاب", "صفحه", "آمده", "گفته", "گفتند", "عبارت", "منبع",
}


def fa_to_en_digits(text: str):
    text = str(text or "")
    for fa, en in zip(PERSIAN_DIGITS, ENGLISH_DIGITS):
        text = text.replace(fa, en)
    return text


def normalize_text(text: str):
    text = fa_to_en_digits(str(text or ""))
    replacements = {
        "ي": "ی", "ك": "ک", "ۀ": "ه", "ة": "ه", "ؤ": "و",
        "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ی",
        "‌": " ", "\u200c": " ", "\u200f": " ", "\u200e": " ",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"[ًٌٍَُِّْـ\u064B-\u065F\u0670]", "", text)
    text = re.sub(r"[^\w\s\u0600-\u06FF]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def extract_keywords(question: str):
    text = normalize_text(question)
    words = re.findall(r"[\wآ-ی]+", text)
    return [word for word in words if len(word) > 2 and word not in STOP_WORDS]


def extract_phrases(question: str):
    normalized = normalize_text(question)
    keywords = extract_keywords(question)
    phrases = []

    quoted_phrases = re.findall(r'[«"]([^»"]+)[»"]', question or "")
    for phrase in quoted_phrases:
        phrase = normalize_text(phrase)
        if phrase:
            phrases.append(phrase)

    for size in (5, 4, 3, 2):
        for index in range(0, max(len(keywords) - size + 1, 0)):
            phrase = " ".join(keywords[index:index + size])
            if phrase and phrase not in phrases:
                phrases.append(phrase)

    if normalized and len(normalized.split()) <= 6 and normalized not in phrases:
        phrases.append(normalized)

    return phrases


def keyword_score(text: str, keywords: list[str]):
    normalized = normalize_text(text)
    score = 0
    for keyword in keywords:
        if keyword in normalized:
            score += 20
    return score


def phrase_score(text: str, question: str):
    normalized_text = normalize_text(text)
    score = 0
    for phrase in extract_phrases(question):
        if len(phrase.split()) >= 2 and phrase in normalized_text:
            score += 180 + len(phrase)
    return score


def get_neighbor_chunks(collection, metadata, window=1, score=60):
    """Return chunks from same file and nearby pages/chunk indexes. Works with page-based IDs."""
    filename = metadata.get("filename")
    page = metadata.get("page")
    chunk_index = metadata.get("chunk_index")

    if filename is None:
        return []

    try:
        data = collection.get(include=["documents", "metadatas"])
        docs = data.get("documents", [])
        metas = data.get("metadatas", [])
    except Exception:
        return []

    results = []

    try:
        page = int(page or 0)
    except Exception:
        page = 0

    try:
        chunk_index = int(chunk_index or 0)
    except Exception:
        chunk_index = 0

    for doc, meta in zip(docs, metas):
        if meta.get("filename") != filename:
            continue

        try:
            meta_page = int(meta.get("page") or 0)
        except Exception:
            meta_page = 0

        try:
            meta_chunk = int(meta.get("chunk_index") or 0)
        except Exception:
            meta_chunk = 0

        same_page_near_chunk = meta_page == page and abs(meta_chunk - chunk_index) <= window
        near_page = page and abs(meta_page - page) <= 1 and meta_chunk == 0

        if same_page_near_chunk or near_page:
            results.append({"document": doc, "metadata": meta, "score": score})

    return results


def smart_search(collection, question: str, n_results: int = 22):
    keywords = extract_keywords(question)
    candidates = []

    try:
        semantic_results = collection.query(
            query_texts=[question],
            n_results=n_results,
            include=["documents", "metadatas"],
        )

        semantic_docs = semantic_results.get("documents", [[]])[0]
        semantic_metas = semantic_results.get("metadatas", [[]])[0]

        for doc, meta in zip(semantic_docs, semantic_metas):
            score = (
                40
                + keyword_score(doc, keywords)
                + keyword_score(meta.get("filename", ""), keywords)
                + phrase_score(doc, question)
                + phrase_score(meta.get("filename", ""), question)
            )
            item = {"document": doc, "metadata": meta, "score": score}
            candidates.append(item)
            candidates.extend(get_neighbor_chunks(collection, meta, window=1, score=55))

    except Exception as error:
        print(f"Semantic search failed: {error}")

    try:
        all_data = collection.get(include=["documents", "metadatas"])
        all_docs = all_data.get("documents", [])
        all_metas = all_data.get("metadatas", [])
    except Exception:
        all_docs = []
        all_metas = []

    for doc, meta in zip(all_docs, all_metas):
        file_name = meta.get("filename", "")
        score = (
            keyword_score(doc, keywords)
            + keyword_score(file_name, keywords)
            + phrase_score(doc, question)
            + phrase_score(file_name, question)
        )

        if score > 0:
            item = {"document": doc, "metadata": meta, "score": score + 20}
            candidates.append(item)
            if score >= 120:
                candidates.extend(get_neighbor_chunks(collection, meta, window=1, score=65))

    unique = {}
    for item in candidates:
        meta = item["metadata"]
        key = f"{meta.get('filename', '')}-page-{meta.get('page', '')}-chunk-{meta.get('chunk_index', '')}"
        if key not in unique or item["score"] > unique[key]["score"]:
            unique[key] = item

    sorted_items = sorted(unique.values(), key=lambda x: x["score"], reverse=True)
    final_items = sorted_items[:n_results]

    documents = [item["document"] for item in final_items]
    metadatas = [item["metadata"] for item in final_items]
    return documents, metadatas
