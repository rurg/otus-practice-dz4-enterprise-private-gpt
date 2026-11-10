""""Загрузка PDF в список LangChain Document с метаданными источника."""

from dataclasses import dataclass
from pathlib import Path

import pymupdf
from langchain_core.documents import Document

from ..config import PROJECT_ROOT


PRIVATE_PDF_DIR = PROJECT_ROOT / "data" / "raw" / "private"
MIN_TEXT_CHARACTERS_PER_PAGE = 80


@dataclass
class PdfInspection:
    """Результат проверки одного PDF-файла."""

    file_name: str
    total_pages: int
    pages_with_sufficient_text: int
    pages_with_little_text: list[int]
    extracted_characters: int

    @property
    def text_coverage_percent(self) -> float:
        """Доля страниц, где извлечено не менее 80 символов текста."""
        if self.total_pages == 0:
            return 0.0

        return self.pages_with_sufficient_text / self.total_pages * 100


def find_pdf_files(directory: Path = PRIVATE_PDF_DIR) -> list[Path]:
    """Возвращает все PDF из папки, включая файлы с расширением .PDF."""
    pdf_files = sorted(
        path
        for path in directory.iterdir()
        if path.is_file() and path.suffix.lower() == ".pdf"
    )

    if not pdf_files:
        raise FileNotFoundError(f"В папке {directory} нет PDF-файлов.")

    return pdf_files


def load_pdf_pages(pdf_path: Path) -> tuple[list[Document], PdfInspection]:
    """
    Читает PDF постранично.

    Каждая непустая страница становится отдельным Document.
    Метаданные source и page понадобятся для показа источника в ответе RAG.
    """
    page_documents: list[Document] = []
    pages_with_little_text: list[int] = []
    extracted_characters = 0
    pages_with_sufficient_text = 0

    with pymupdf.open(pdf_path) as pdf_document:
        if pdf_document.needs_pass:
            raise PermissionError(
                f"PDF защищён паролем: {pdf_path.name}. "
                "Для корпуса нужен незапароленный файл."
            )

        # Сохраняем число страниц, пока PDF ещё открыт.
        total_pages = len(pdf_document)

        for page_number, page in enumerate(pdf_document, start=1):
            # sort=True стремится вернуть текст в порядке чтения страницы.
            page_text = page.get_text("text", sort=True).strip()
            extracted_characters += len(page_text)

            if len(page_text) < MIN_TEXT_CHARACTERS_PER_PAGE:
                pages_with_little_text.append(page_number)
            else:
                pages_with_sufficient_text += 1

            # Пустую страницу не имеет смысла векторизовать.
            if page_text:
                page_documents.append(
                    Document(
                        page_content=page_text,
                        metadata={
                            "source": pdf_path.name,
                            "page": page_number,
                        },
                    )
                )

    # Здесь PDF уже закрыт, поэтому используем сохранённую переменную total_pages.
    inspection = PdfInspection(
        file_name=pdf_path.name,
        total_pages=total_pages,
        pages_with_sufficient_text=pages_with_sufficient_text,
        pages_with_little_text=pages_with_little_text,
        extracted_characters=extracted_characters,
    )

    return page_documents, inspection