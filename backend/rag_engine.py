import re


PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
ENGLISH_DIGITS = "0123456789"


def fa_to_en_digits(text: str):
    for fa, en in zip(PERSIAN_DIGITS, ENGLISH_DIGITS):
        text = text.replace(fa, en)
    return text


def normalize_text(text: str):
    text = str(text or "")
    text = fa_to_en_digits(text)
    text = text.replace("ي", "ی").replace("ك", "ک")
    text = text.replace("ۀ", "ه").replace("ة", "ه")
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = re.sub(r"[ًٌٍَُِّْـ]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def extract_keywords(question: str):
    text = normalize_text(question)

    stop_words = {
        "در", "از", "به", "با", "برای", "را", "و", "یا", "که", "این", "آن",
        "یک", "کن", "کنید", "برام", "برایم", "تحقیق", "توضیح", "بده",
        "بگویید", "چیست", "است", "هست", "خصوص", "مورد", "نظر", "استاد",
        "درباره", "راجع", "لطفا", "لطفاً", "میگه", "چی", "استخراج"
    }

    words = re.findall(r"[\wآ-ی]+", text)
    return [w for w in words if len(w) > 2 and w not in stop_words]


def keyword_score(text: str, keywords: list[str]):
    normalized = normalize_text(text)
    score = 0

    for keyword in keywords:
        if keyword in normalized:
            score += 20

    return score


def phrase_score(text: str, question: str):
    normalized_text = normalize_text(text)
    normalized_question = normalize_text(question)

    keywords = extract_keywords(question)

    score = 0

    if normalized_question and normalized_question in normalized_text:
        score += 200

    if len(keywords) >= 2:
        phrase = " ".join(keywords)
        if phrase in normalized_text:
            score += 150

    return score


def get_neighbor_chunks(collection, metadata, window=3, score=80):
    filename = metadata.get("filename")
    chunk_index = metadata.get("chunk_index")

    if filename is None or chunk_index is None:
        return []

    neighbor_ids = []

    for i in range(int(chunk_index) - window, int(chunk_index) + window + 1):
        if i >= 0:
            neighbor_ids.append(f"{filename}-{i}")

    try:
        data = collection.get(
            ids=neighbor_ids,
            include=["documents", "metadatas"],
        )

        docs = data.get("documents", [])
        metas = data.get("metadatas", [])

        return [
            {
                "document": doc,
                "metadata": meta,
                "score": score,
            }
            for doc, meta in zip(docs, metas)
        ]
    except Exception:
        return []


def extract_page_hints(text: str, question: str):
    normalized_text = normalize_text(text)
    keywords = extract_keywords(question)

    pages = set()

    for keyword in keywords:
        index = normalized_text.find(keyword)

        if index == -1:
            continue

        start = max(0, index - 120)
        end = min(len(normalized_text), index + 180)
        window_text = normalized_text[start:end]

        numbers = re.findall(r"\b\d{1,4}\b", window_text)

        for number in numbers:
            page = int(number)
            if 1 <= page <= 3000:
                pages.add(page)

    return sorted(pages)


def get_chunks_by_pages(collection, filename: str, pages: list[int], score=180):
    if not pages:
        return []

    try:
        data = collection.get(include=["documents", "metadatas"])
        docs = data.get("documents", [])
        metas = data.get("metadatas", [])
    except Exception:
        return []

    results = []

    target_pages = set()

    for page in pages:
        target_pages.add(page)
        target_pages.add(page - 1)
        target_pages.add(page + 1)

    for doc, meta in zip(docs, metas):
        if meta.get("filename") != filename:
            continue

        normalized_doc = fa_to_en_digits(str(doc))

        for page in target_pages:
            if page <= 0:
                continue

            if f"[Page {page}]" in normalized_doc:
                results.append(
                    {
                        "document": doc,
                        "metadata": meta,
                        "score": score,
                    }
                )
                break

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

            item = {
                "document": doc,
                "metadata": meta,
                "score": score,
            }

            candidates.append(item)
            candidates.extend(get_neighbor_chunks(collection, meta, window=3, score=70))

    except Exception:
        pass

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
            item = {
                "document": doc,
                "metadata": meta,
                "score": score,
            }

            candidates.append(item)
            candidates.extend(get_neighbor_chunks(collection, meta, window=3, score=90))

            page_hints = extract_page_hints(doc, question)
            candidates.extend(
                get_chunks_by_pages(
                    collection=collection,
                    filename=file_name,
                    pages=page_hints,
                    score=220,
                )
            )

    unique = {}

    for item in candidates:
        meta = item["metadata"]
        key = meta.get("filename", "") + "-" + str(meta.get("chunk_index", ""))

        if key not in unique or item["score"] > unique[key]["score"]:
            unique[key] = item

    sorted_items = sorted(
        unique.values(),
        key=lambda x: x["score"],
        reverse=True,
    )

    final_items = sorted_items[:n_results]

    documents = [item["document"] for item in final_items]
    metadatas = [item["metadata"] for item in final_items]

    return documents, metadatas