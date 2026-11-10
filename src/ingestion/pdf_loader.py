"""Загрузка страниц PDF в LangChain Document с указанием источника."""

import json
from dataclasses import dataclass
from pathlib import Path

import pymupdf
from langchain_core.documents import Document

from ..config import PROJECT_ROOT


PRIVATE_PDF_DIR = PROJECT_ROOT / "data" / "raw" / "private"
OCR_TEXT_PATH = (
    PROJECT_ROOT / "data" / "processed" / "private" / "generative_ai_ocr.jsonl"
)
MIN_TEXT_CHARACTERS_PER_PAGE = 80


@dataclass
class PdfInspection:
    """Статистика извлечения текста из одного PDF."""

    file_name: str
    total_pages: int
    pages_with_sufficient_text: int
    pages_with_little_text: list[int]
    extracted_characters: int

    @property
    def text_coverage_percent(self) -> float:
        """Доля страниц, на которых найдено не менее 80 символов."""
        if self.total_pages == 0:
            return 0.0

        return self.pages_with_sufficient_text / self.total_pages * 100


def find_pdf_files(directory: Path = PRIVATE_PDF_DIR) -> list[Path]:
    """Возвращает PDF-файлы из папки."""
    pdf_files = sorted(
        path
        for path in directory.iterdir()
        if path.is_file() and path.suffix.lower() == ".pdf"
    )

    if not pdf_files:
        raise FileNotFoundError(f"В папке {directory} нет PDF-файлов.")

    return pdf_files


def load_pdf_pages(pdf_path: Path) -> tuple[list[Document], PdfInspection]:
    """Читает страницы книги и собирает статистику качества текста."""
    page_documents: list[Document] = []
    pages_with_little_text: list[int] = []
    extracted_characters = 0
    pages_with_sufficient_text = 0

    # Оба способа чтения ниже приводим к одному виду: (номер страницы, текст).
    page_texts: list[tuple[int, str]] = []

    with pymupdf.open(pdf_path) as pdf_document:
        if pdf_document.needs_pass:
            raise PermissionError(f"PDF защищён паролем: {pdf_path.name}")

        total_pages = len(pdf_document)

        if pdf_path.name.startswith("Генератив"):
            # У этой книги текстовый слой теряет русские абзацы.
            # Берём результат однократного OCR, чтобы не повторять его при каждом запуске.
            with OCR_TEXT_PATH.open(encoding="utf-8") as ocr_file:
                for line in ocr_file:
                    record = json.loads(line)
                    page_texts.append((record["page"], record["text"]))
        else:
            for page_index in range(total_pages):
                page = pdf_document.load_page(page_index)
                text = page.get_text("text", sort=True)

                # Индекс PyMuPDF начинается с 0, а номер страницы для читателя — с 1.
                page_texts.append((page_index + 1, text))

    for page_number, raw_text in page_texts:
        page_text = raw_text.strip()
        extracted_characters += len(page_text)

        # Порог нужен только для отчёта: короткие страницы не удаляем.
        if len(page_text) < MIN_TEXT_CHARACTERS_PER_PAGE:
            pages_with_little_text.append(page_number)
        else:
            pages_with_sufficient_text += 1

        if page_text:
            page_documents.append(
                Document(
                    page_content=page_text,
                    # Чанки унаследуют эти данные для ссылки на книгу и страницу.
                    metadata={
                        "source": pdf_path.name,
                        "page": page_number,
                    },
                )
            )

    inspection = PdfInspection(
        file_name=pdf_path.name,
        total_pages=total_pages,
        pages_with_sufficient_text=pages_with_sufficient_text,
        pages_with_little_text=pages_with_little_text,
        extracted_characters=extracted_characters,
    )

    return page_documents, inspection