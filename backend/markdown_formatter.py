import re
from dataclasses import dataclass
from typing import Literal


BlockType = Literal["heading", "paragraph", "bullet", "numbered", "quote", "separator"]


@dataclass(frozen=True)
class DocumentBlock:
    block_type: BlockType
    text: str
    level: int = 0


def strip_inline_markdown(text: str) -> str:
    """Remove common inline Markdown while preserving readable text."""
    value = str(text or "")
    value = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"`{1,3}([^`]+)`{1,3}", r"\1", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"\1", value)
    value = re.sub(r"__([^_]+)__", r"\1", value)
    value = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"\1", value)
    value = re.sub(r"(?<!_)_([^_]+)_(?!_)", r"\1", value)
    value = value.replace("\\", "")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def markdown_to_plain_text(markdown: str) -> str:
    """Convert Markdown to clean copyable text without visible #, *, or list syntax."""
    lines: list[str] = []

    for raw_line in str(markdown or "").splitlines():
        line = raw_line.strip()

        if not line:
            if lines and lines[-1] != "":
                lines.append("")
            continue

        if re.fullmatch(r"[-*_]{3,}", line):
            continue

        line = re.sub(r"^#{1,6}\s*", "", line)
        line = re.sub(r"^>\s?", "", line)
        line = re.sub(r"^[-+*]\s+", "• ", line)
        line = re.sub(r"^\d+[.)]\s+", "", line)
        line = strip_inline_markdown(line)

        if line:
            lines.append(line)

    while lines and lines[-1] == "":
        lines.pop()

    return "\n".join(lines)


def parse_markdown_blocks(markdown: str) -> list[DocumentBlock]:
    """Parse the subset of Markdown used by the assistant into document blocks."""
    blocks: list[DocumentBlock] = []
    paragraph_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph_lines

        if paragraph_lines:
            text = strip_inline_markdown(" ".join(paragraph_lines))
            if text:
                blocks.append(DocumentBlock("paragraph", text))
            paragraph_lines = []

    for raw_line in str(markdown or "").splitlines():
        line = raw_line.strip()

        if not line:
            flush_paragraph()
            continue

        if re.fullmatch(r"[-*_]{3,}", line):
            flush_paragraph()
            blocks.append(DocumentBlock("separator", ""))
            continue

        heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)
        if heading_match:
            flush_paragraph()
            blocks.append(
                DocumentBlock(
                    "heading",
                    strip_inline_markdown(heading_match.group(2)),
                    min(len(heading_match.group(1)), 3),
                )
            )
            continue

        bullet_match = re.match(r"^[-+*]\s+(.+)$", line)
        if bullet_match:
            flush_paragraph()
            blocks.append(
                DocumentBlock("bullet", strip_inline_markdown(bullet_match.group(1)))
            )
            continue

        numbered_match = re.match(r"^\d+[.)]\s+(.+)$", line)
        if numbered_match:
            flush_paragraph()
            blocks.append(
                DocumentBlock("numbered", strip_inline_markdown(numbered_match.group(1)))
            )
            continue

        quote_match = re.match(r"^>\s?(.+)$", line)
        if quote_match:
            flush_paragraph()
            blocks.append(
                DocumentBlock("quote", strip_inline_markdown(quote_match.group(1)))
            )
            continue

        paragraph_lines.append(line)

    flush_paragraph()
    return blocks
