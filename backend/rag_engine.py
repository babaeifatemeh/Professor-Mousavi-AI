import re
from collections import defaultdict


PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
ENGLISH_DIGITS = "0123456789"

PERSIAN_STOP_WORDS = {
    "در", "از", "به", "با", "برای", "را", "و", "یا", "که", "این", "آن", "یک",
    "کن", "کنید", "برام", "برایم", "تحقیق", "توضیح", "بده", "بگویید",
    "چیست", "است", "هست", "خصوص", "مورد", "نظر", "استاد", "درباره",
    "راجع", "لطفا", "لطفاً", "میگه", "چی", "چیه", "کدام", "کدوم",
    "منبع", "مطلب", "آمده", "اومده", "گفته", "فرموده", "کردند", "کرده",
    "تعبیر", "اشاره", "بررسی", "پیدا", "سرچ", "جستجو", "بنویس",
    "مقاله", "متن", "های", "هایی", "ها", "هایش", "شان", "ایشان"
}

ARABIC_PERSIAN_EQUIV = {
    "علیه السلام": "ع",
    "عليه السلام": "ع",
    "علیهالسلام": "ع",
    "عليهالسلام": "ع",
    "صلی الله علیه و آله": "ص",
    "صلي الله عليه و آله": "ص",
    "رحمه الله": "ره",
}


def fa_to_en_digits(text: str) -> str:
    text = str(text or "")
    for fa, en in zip(PERSIAN_DIGITS, ENGLISH_DIGITS):
        text = text.replace(fa, en)
    return text


def normalize_text(text: str) -> str:
    text = str(text or "")
    text = fa_to_en_digits(text)

    for old, new in ARABIC_PERSIAN_EQUIV.items():
        text = text.replace(old, new)

    text = text.replace("ي", "ی").replace("ى", "ی").replace("ك", "ک")
    text = text.replace("ۀ", "ه").replace("ة", "ه").replace("هٔ", "ه")
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ؤ", "و").replace("ئ", "ی")
    text = text.replace("‌", " ")
    text = re.sub(r"[ًٌٍَُِّْـ]", "", text)
    text = re.sub(r"[«»\"'“”‘’\(\)\[\]\{\}:؛،,.!?؟!ـ\-_/\\|]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def compact_text(text: str) -> str:
    text = normalize_text(text)
    return re.sub(r"\s+", "", text)


def tokenize(text: str) -> list[str]:
    normalized = normalize_text(text)
    words = re.findall(r"[\wآ-ی]+", normalized)
    clean_words = []
    for word in words:
        word = word.strip()
        if len(word) < 2:
            continue
        if word in PERSIAN_STOP_WORDS:
            continue
        clean_words.append(word)
    return clean_words


def extract_keywords(question: str) -> list[str]:
    words = tokenize(question)

    expanded = []
    for word in words:
        expanded.append(word)
        if word.endswith("ی"):
            expanded.append(word[:-1] + "ي")

    seen = set()
    result = []
    for word in expanded:
        normalized = normalize_text(word)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result


def get_query_phrases(question: str) -> list[str]:
    normalized = normalize_text(question)
    keywords = extract_keywords(question)

    phrases = []
    if normalized:
        phrases.append(normalized)

    if len(keywords) >= 2:
        for size in range(min(5, len(keywords)), 1, -1):
            for i in range(0, len(keywords) - size + 1):
                phrases.append(" ".join(keywords[i:i + size]))

    seen = set()
    output = []
    for phrase in phrases:
        phrase = normalize_text(phrase)
        if phrase and phrase not in seen:
            seen.add(phrase)
            output.append(phrase)
    return output


def keyword_score(text: str, keywords: list[str]) -> int:
    normalized = normalize_text(text)
    compact = compact_text(text)
    score = 0

    for keyword in keywords:
        keyword = normalize_text(keyword)
        if not keyword:
            continue

        if re.search(rf"(^|\s){re.escape(keyword)}($|\s)", normalized):
            score += 90
        elif keyword in normalized:
            score += 55

        if compact_text(keyword) in compact:
            score += 45

    return score


def phrase_score(text: str, question: str) -> int:
    normalized_text = normalize_text(text)
    compact = compact_text(text)
    score = 0

    for phrase in get_query_phrases(question):
        if len(phrase) < 2:
            continue
        if phrase in normalized_text:
            score += 250 + (len(phrase) // 2)
        if compact_text(phrase) in compact:
            score += 180 + (len(phrase) // 3)

    return score


def filename_score(filename: str, question: str) -> int:
    keywords = extract_keywords(question)
    return keyword_score(filename, keywords) * 3 + phrase_score(filename, question) * 3


def get_chunk_index(metadata) -> int | None:
    try:
        value = metadata.get("chunk_index")
        if value is None:
            return None
        return int(value)
    except Exception:
        return None


def get_page(metadata) -> int:
    try:
        page = metadata.get("page", 0)
        return int(page or 0)
    except Exception:
        return 0


def make_key(metadata, fallback_index: int = 0) -> str:
    filename = str(metadata.get("filename", ""))
    chunk_index = metadata.get("chunk_index")
    page = metadata.get("page")
    if chunk_index is not None:
        return f"{filename}::chunk::{chunk_index}"
    return f"{filename}::page::{page}::fallback::{fallback_index}"


def get_neighbor_chunks(collection, metadata, window=3, score=120):
    filename = metadata.get("filename")
    chunk_index = get_chunk_index(metadata)

    if filename is None or chunk_index is None:
        return []

    neighbor_ids = [
        f"{filename}-{i}"
        for i in range(chunk_index - window, chunk_index + window + 1)
        if i >= 0
    ]

    try:
        data = collection.get(ids=neighbor_ids, include=["documents", "metadatas"])
        docs = data.get("documents", [])
        metas = data.get("metadatas", [])
    except Exception:
        return []

    return [
        {"document": doc, "metadata": meta, "score": score, "reason": "neighbor"}
        for doc, meta in zip(docs, metas)
    ]


def exact_lexical_candidates(all_docs, all_metas, question: str):
    keywords = extract_keywords(question)
    results = []

    for doc, meta in zip(all_docs, all_metas):
        filename = str(meta.get("filename", ""))
        score = 0
        score += keyword_score(doc, keywords)
        score += phrase_score(doc, question)
        score += filename_score(filename, question)

        normalized_doc = normalize_text(doc)
        compact_doc = compact_text(doc)
        hit_count = 0

        for keyword in keywords:
            if keyword in normalized_doc or compact_text(keyword) in compact_doc:
                hit_count += 1

        if hit_count >= 2:
            score += hit_count * 140

        if len(keywords) == 1 and keywords[0] in normalized_doc:
            score += 500

        file_hit = filename_score(filename, question)
        if file_hit:
            score += 400 + file_hit

        if score > 0:
            results.append({
                "document": doc,
                "metadata": meta,
                "score": score,
                "reason": "exact",
            })

    return results


def semantic_candidates(collection, question: str, n_results: int):
    try:
        semantic_results = collection.query(
            query_texts=[question],
            n_results=max(10, n_results),
            include=["documents", "metadatas"],
        )
        semantic_docs = semantic_results.get("documents", [[]])[0]
        semantic_metas = semantic_results.get("metadatas", [[]])[0]
    except Exception:
        return []

    keywords = extract_keywords(question)
    results = []

    for rank, (doc, meta) in enumerate(zip(semantic_docs, semantic_metas)):
        base = max(0, 160 - rank * 4)
        score = (
            base
            + keyword_score(doc, keywords)
            + phrase_score(doc, question)
            + filename_score(meta.get("filename", ""), question)
        )
        results.append({
            "document": doc,
            "metadata": meta,
            "score": score,
            "reason": "semantic",
        })

    return results


def merge_candidates(candidates):
    unique = {}
    for idx, item in enumerate(candidates):
        meta = item.get("metadata", {}) or {}
        key = make_key(meta, fallback_index=idx)
        if key not in unique or item.get("score", 0) > unique[key].get("score", 0):
            unique[key] = item
    return list(unique.values())


def diversify_by_source(sorted_items, n_results: int, per_source_limit: int = 8):
    selected = []
    per_source_count = defaultdict(int)

    for item in sorted_items:
        filename = item["metadata"].get("filename", "unknown")
        if per_source_count[filename] < per_source_limit:
            selected.append(item)
            per_source_count[filename] += 1
        if len(selected) >= n_results:
            return selected

    selected_keys = {make_key(item["metadata"], i) for i, item in enumerate(selected)}
    for i, item in enumerate(sorted_items):
        key = make_key(item["metadata"], i)
        if key in selected_keys:
            continue
        selected.append(item)
        if len(selected) >= n_results:
            break
    return selected


def smart_search(collection, question: str, n_results: int = 30):
    """
    Professional hybrid retrieval for Persian/Arabic religious texts.

    It combines:
    1) exact full-text lexical search over ALL uploaded chunks,
    2) semantic Chroma search,
    3) filename/title boosting,
    4) neighboring chunks for context,
    5) source diversification.

    Result: even a single word such as "عطارد" or "پیشانی" can be found
    if it exists anywhere in the indexed documents.
    """
    try:
        all_data = collection.get(include=["documents", "metadatas"])
        all_docs = all_data.get("documents", [])
        all_metas = all_data.get("metadatas", [])
    except Exception:
        all_docs = []
        all_metas = []

    total_chunks = len(all_docs)
    if total_chunks == 0:
        return [], []

    search_size = min(total_chunks, max(n_results * 3, 80))

    candidates = []
    candidates.extend(exact_lexical_candidates(all_docs, all_metas, question))
    candidates.extend(semantic_candidates(collection, question, search_size))

    enriched = []
    for item in candidates:
        enriched.append(item)
        if item.get("score", 0) >= 300:
            enriched.extend(
                get_neighbor_chunks(
                    collection,
                    item.get("metadata", {}),
                    window=3,
                    score=max(120, item.get("score", 0) - 180),
                )
            )

    unique_items = merge_candidates(enriched)
    sorted_items = sorted(
        unique_items,
        key=lambda x: (x.get("score", 0), -get_page(x.get("metadata", {}))),
        reverse=True,
    )

    keywords = extract_keywords(question)
    per_source_limit = 12 if len(keywords) <= 1 else 8

    final_items = diversify_by_source(
        sorted_items=sorted_items,
        n_results=n_results,
        per_source_limit=per_source_limit,
    )

    documents = [item["document"] for item in final_items]
    metadatas = [item["metadata"] for item in final_items]
    return documents, metadatas
