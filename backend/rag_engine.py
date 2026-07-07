import re


PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
ENGLISH_DIGITS = "0123456789"


def fa_to_en_digits(text: str) -> str:
    text = str(text or "")
    for fa, en in zip(PERSIAN_DIGITS, ENGLISH_DIGITS):
        text = text.replace(fa, en)
    return text


def normalize_text(text: str) -> str:
    text = str(text or "")
    text = fa_to_en_digits(text)
    text = text.replace("ي", "ی").replace("ك", "ک")
    text = text.replace("ۀ", "ه").replace("ة", "ه")
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = re.sub(r"[ًٌٍَُِّْـ]", "", text)
    text = re.sub(r"[^\w\sآ-ی]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def extract_keywords(question: str):
    text = normalize_text(question)

    stop_words = {
        "در", "از", "به", "با", "برای", "را", "و", "یا", "که", "این", "آن",
        "یک", "کن", "کنید", "برام", "برایم", "تحقیق", "توضیح", "بده",
        "بگویید", "چیست", "است", "هست", "خصوص", "مورد", "نظر", "استاد",
        "درباره", "راجع", "لطفا", "لطفاً", "میگه", "چی", "چه", "کدام",
        "مطلب", "آمده", "فرمودند", "گفتند", "کردند", "تعبیر", "بررسی"
    }

    words = re.findall(r"[\wآ-ی]+", text)
    return [word for word in words if len(word) >= 2 and word not in stop_words]


def keyword_score(text: str, keywords) -> int:
    normalized = normalize_text(text)
    score = 0

    for keyword in keywords:
        if not keyword:
            continue

        if keyword in normalized:
            score += 25

        # Stronger score for exact word boundary-like match
        if re.search(rf"(^|\s){re.escape(keyword)}($|\s)", normalized):
            score += 35

    return score


def phrase_score(text: str, question: str) -> int:
    normalized_text = normalize_text(text)
    normalized_question = normalize_text(question)
    keywords = extract_keywords(question)

    score = 0

    if normalized_question and normalized_question in normalized_text:
        score += 300

    if len(keywords) >= 2:
        phrase = " ".join(keywords)
        if phrase in normalized_text:
            score += 220

    return score


def file_score(metadata, question: str, keywords) -> int:
    filename = ""
    if isinstance(metadata, dict):
        filename = metadata.get("filename", "")

    return (
        keyword_score(filename, keywords)
        + phrase_score(filename, question)
    )


def make_key(item):
    metadata = item.get("metadata") or {}
    filename = metadata.get("filename", "")
    chunk_index = metadata.get("chunk_index", "")
    page = metadata.get("page", "")

    if filename or chunk_index != "":
        return f"{filename}-{chunk_index}-{page}"

    return str(hash(item.get("document", "")))


def add_neighbor_chunks(collection, base_item, window=1, score=45):
    metadata = base_item.get("metadata") or {}
    filename = metadata.get("filename")
    chunk_index = metadata.get("chunk_index")

    if filename is None or chunk_index is None:
        return []

    try:
        chunk_index = int(chunk_index)
    except Exception:
        return []

    ids = []
    for index in range(max(0, chunk_index - window), chunk_index + window + 1):
        ids.append(f"{filename}-{index}")

    try:
        data = collection.get(
            ids=ids,
            include=["documents", "metadatas"],
        )

        docs = data.get("documents", []) or []
        metas = data.get("metadatas", []) or []

        return [
            {
                "document": doc,
                "metadata": meta or {},
                "score": score,
            }
            for doc, meta in zip(docs, metas)
            if doc
        ]
    except Exception:
        return []


def smart_search(collection, question: str, n_results: int = 18):
    """
    Stable hybrid search for the Professor Mousavi project.

    It keeps the old safe behavior:
    - semantic Chroma search first
    - then exact keyword/phrase search across stored chunks
    - no upload/indexing logic is touched
    - all risky operations are protected with try/except

    Returns:
        documents, metadatas
    """
    safe_limit = max(1, min(int(n_results or 18), 40))
    keywords = extract_keywords(question)
    candidates = []

    # 1) Semantic Chroma search
    try:
        semantic_results = collection.query(
            query_texts=[question],
            n_results=safe_limit,
            include=["documents", "metadatas"],
        )

        semantic_docs = semantic_results.get("documents", [[]])[0] or []
        semantic_metas = semantic_results.get("metadatas", [[]])[0] or []

        for doc, meta in zip(semantic_docs, semantic_metas):
            meta = meta or {}
            score = (
                100
                + keyword_score(doc, keywords)
                + phrase_score(doc, question)
                + file_score(meta, question, keywords)
            )

            item = {
                "document": doc,
                "metadata": meta,
                "score": score,
            }

            candidates.append(item)
            candidates.extend(add_neighbor_chunks(collection, item, window=1, score=55))

    except Exception as error:
        print(f"smart_search semantic search failed: {error}")

    # 2) Exact keyword/phrase search across available chunks
    # This is what helps one-word queries such as عطارد.
    try:
        all_data = collection.get(include=["documents", "metadatas"])
        all_docs = all_data.get("documents", []) or []
        all_metas = all_data.get("metadatas", []) or []

        for doc, meta in zip(all_docs, all_metas):
            meta = meta or {}

            score = (
                keyword_score(doc, keywords)
                + phrase_score(doc, question)
                + file_score(meta, question, keywords)
            )

            if score <= 0:
                continue

            item = {
                "document": doc,
                "metadata": meta,
                "score": score + 80,
            }

            candidates.append(item)

            # Add one neighbor on both sides for context, but keep it light.
            if score >= 60:
                candidates.extend(add_neighbor_chunks(collection, item, window=1, score=40))

    except Exception as error:
        print(f"smart_search exact search failed: {error}")

    # 3) Deduplicate and sort
    unique = {}

    for item in candidates:
        if not item.get("document"):
            continue

        key = make_key(item)

        if key not in unique or item["score"] > unique[key]["score"]:
            unique[key] = item

    sorted_items = sorted(
        unique.values(),
        key=lambda item: item.get("score", 0),
        reverse=True,
    )

    final_items = sorted_items[:safe_limit]

    documents = [item["document"] for item in final_items]
    metadatas = [item["metadata"] for item in final_items]

    return documents, metadatas
