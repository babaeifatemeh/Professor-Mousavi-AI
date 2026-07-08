import re
from typing import Any

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
    replacements = {
        "ي": "ی", "ك": "ک", "ۀ": "ه", "ة": "ه", "ؤ": "و",
        "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ی",
        "‌": " ", "\u200c": " ", "\u200f": " ", "\u200e": " ",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"[ًٌٍَُِّْـ\u064B-\u065F\u0670]", "", text)
    text = re.sub(r"[^\w\s\u0600-\u06FF]", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


STOP_WORDS = {
    "در", "از", "به", "با", "برای", "را", "و", "یا", "که", "این", "آن", "یک",
    "کن", "کنید", "بده", "بدهید", "بگو", "بگویید", "لطفا", "لطفاً", "برام", "برایم",
    "چی", "چیست", "چه", "است", "هست", "بود", "باشد", "می", "شود", "شد", "کرد",
    "مورد", "خصوص", "درباره", "راجع", "داخل", "توی", "عبارت", "کلمه", "جمله",
    "استاد", "موسوی", "علامه", "سید", "علی", "ره", "منبع", "منابع", "فایل", "کتاب",
    "مقاله", "صفحه", "جلد", "آمده", "اومده", "کدام", "کجا", "نقل", "پیدا", "سرچ",
}


def extract_tokens(text: str) -> list[str]:
    normalized = normalize_text(text)
    words = re.findall(r"[\w\u0600-\u06FF]+", normalized)
    return [w for w in words if len(w) >= 2 and w not in STOP_WORDS and not w.isdigit()]


def extract_phrases(question: str) -> list[str]:
    phrases: list[str] = []
    for raw in re.findall(r"[«\"]([^»\"]+)[»\"]", question or ""):
        phrase = normalize_text(raw)
        if len(phrase) >= 2 and phrase not in phrases:
            phrases.append(phrase)

    tokens = extract_tokens(question)
    for size in (6, 5, 4, 3, 2):
        for i in range(0, max(len(tokens) - size + 1, 0)):
            phrase = " ".join(tokens[i:i + size])
            if len(phrase) >= 4 and phrase not in phrases:
                phrases.append(phrase)
    return phrases


def extract_requested_page(question: str) -> int | None:
    normalized = normalize_text(question)
    patterns = [r"صفحه\s+(\d{1,4})", r"ص\s*(\d{1,4})"]
    for pattern in patterns:
        match = re.search(pattern, normalized)
        if match:
            return int(match.group(1))
    return None


def classify_query(question: str) -> str:
    q = normalize_text(question)
    tokens = extract_tokens(question)

    article_words = ["مقاله", "بنویس", "بنویسید", "تحلیل", "تبیین", "توضیح کامل", "جمع بندی", "دسته بندی"]
    source_words = ["کدام فایل", "کدام مقاله", "کدام کتاب", "کدام منبع", "کجا آمده", "کجا اومده", "در کدام", "کجا هست", "کجا پیدا"]

    if any(word in q for word in article_words):
        return "article"
    if any(word in q for word in source_words):
        return "source_lookup"
    if extract_requested_page(question) is not None:
        return "exact_lookup"
    if "«" in (question or "") or "\"" in (question or ""):
        return "exact_lookup"
    if len(tokens) <= 4:
        return "exact_lookup"
    return "topic_search"


def _all_collection_items(collection) -> list[dict[str, Any]]:
    data = collection.get(include=["documents", "metadatas"])
    ids = data.get("ids", []) or []
    docs = data.get("documents", []) or []
    metas = data.get("metadatas", []) or []
    items = []
    for item_id, doc, meta in zip(ids, docs, metas):
        items.append({"id": item_id, "document": doc or "", "metadata": meta or {}, "score": 0, "match_type": ""})
    return items


def _score_exact(item: dict[str, Any], question: str) -> int:
    document = normalize_text(item.get("document", ""))
    metadata = item.get("metadata", {}) or {}
    filename = normalize_text(metadata.get("filename", ""))
    page = metadata.get("page", 0)

    tokens = extract_tokens(question)
    phrases = extract_phrases(question)
    requested_page = extract_requested_page(question)

    score = 0
    phrase_hits = 0
    token_hits = 0

    for phrase in phrases:
        if phrase and phrase in document:
            score += 1000 + len(phrase) * 3
            phrase_hits += 1
        if phrase and phrase in filename:
            score += 700 + len(phrase) * 2
            phrase_hits += 1

    for token in tokens:
        if token in document:
            score += 80
            token_hits += 1
        if token in filename:
            score += 200
            token_hits += 1

    if tokens and all(token in document or token in filename for token in tokens):
        score += 450

    if requested_page is not None:
        try:
            page_number = int(page or 0)
        except Exception:
            page_number = 0
        if page_number == requested_page:
            score += 900
        elif abs(page_number - requested_page) == 1:
            score += 180

    if phrase_hits:
        score += 300
    elif tokens and token_hits == 0:
        score = 0

    return score


def _semantic_candidates(collection, question: str, n_results: int) -> list[dict[str, Any]]:
    try:
        results = collection.query(
            query_texts=[question],
            n_results=n_results,
            include=["documents", "metadatas"],
        )
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        candidates = []
        for rank, (doc, meta) in enumerate(zip(docs, metas)):
            base = max(1, 120 - rank)
            item = {"id": f"{meta.get('filename', '')}-p{meta.get('page', '')}-c{meta.get('chunk_index', '')}", "document": doc or "", "metadata": meta or {}, "score": base, "match_type": "semantic"}
            item["score"] += min(_score_exact(item, question), 500)
            candidates.append(item)
        return candidates
    except Exception:
        return []


def _dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique: dict[str, dict[str, Any]] = {}
    for item in items:
        meta = item.get("metadata", {}) or {}
        key = f"{meta.get('filename','')}|{meta.get('page','')}|{meta.get('chunk_index','')}"
        if key not in unique or item.get("score", 0) > unique[key].get("score", 0):
            unique[key] = item
    return sorted(unique.values(), key=lambda x: x.get("score", 0), reverse=True)


def _limit_by_source(items: list[dict[str, Any]], max_total: int, per_file: int) -> list[dict[str, Any]]:
    selected = []
    counts: dict[str, int] = {}
    for item in items:
        filename = (item.get("metadata", {}) or {}).get("filename", "")
        counts.setdefault(filename, 0)
        if counts[filename] < per_file:
            selected.append(item)
            counts[filename] += 1
        if len(selected) >= max_total:
            break
    return selected


def search_research(collection, question: str, n_results: int = 24) -> dict[str, Any]:
    mode = classify_query(question)
    all_items = _all_collection_items(collection)

    exact_items = []
    for item in all_items:
        score = _score_exact(item, question)
        if score > 0:
            new_item = dict(item)
            new_item["score"] = score
            new_item["match_type"] = "exact"
            exact_items.append(new_item)
    exact_items = _dedupe(exact_items)

    # For source/exact lookup, do NOT pollute results with semantic guesses if exact matches exist.
    if mode in {"source_lookup", "exact_lookup"} and exact_items:
        selected = _limit_by_source(exact_items, max_total=min(n_results, 30), per_file=8)
        return {"mode": mode, "items": selected, "used_semantic": False}

    semantic_items = _semantic_candidates(collection, question, n_results=max(n_results * 3, 30))

    if mode == "article":
        merged = _dedupe(exact_items + semantic_items)
        selected = _limit_by_source(merged, max_total=max(n_results, 28), per_file=5)
        return {"mode": mode, "items": selected, "used_semantic": True}

    if mode == "topic_search":
        merged = _dedupe(exact_items + semantic_items)
        selected = _limit_by_source(merged, max_total=n_results, per_file=4)
        return {"mode": mode, "items": selected, "used_semantic": True}

    # No exact result was found for an exact/source question: fall back carefully.
    selected = _limit_by_source(_dedupe(semantic_items), max_total=min(n_results, 16), per_file=3)
    return {"mode": mode, "items": selected, "used_semantic": True}


def smart_search(collection, question: str, n_results: int = 24):
    result = search_research(collection, question, n_results=n_results)
    items = result.get("items", [])
    documents = [item.get("document", "") for item in items]
    metadatas = [item.get("metadata", {}) for item in items]
    return documents, metadatas
