"""Проверка качества извлечения текста из PDF до чанкирования."""

import pymupdf

from .ingestion.pdf_loader import find_pdf_files, load_pdf_pages


SAMPLE_LENGTH = 500


def main() -> None:
    """Проверяет все PDF в data/raw/private."""
    pdf_files = find_pdf_files()

    total_pages = 0
    total_documents = 0
    total_characters = 0

    print(f"Найдено PDF-файлов: {len(pdf_files)}\n")

    for pdf_path in pdf_files:
        try:
            page_documents, inspection = load_pdf_pages(pdf_path)

        # Один проблемный файл не мешает проверить остальные книги.
        except PermissionError as error:
            print(f"Файл: {pdf_path.name}")
            print(f"  Пропущен: {error}\n")
            continue

        except pymupdf.FileDataError:
            print(f"Файл: {pdf_path.name}")
            print("  Пропущен: PDF повреждён или имеет неверный формат.\n")
            continue

        total_pages += inspection.total_pages
        total_documents += len(page_documents)
        total_characters += inspection.extracted_characters

        print(f"Файл: {inspection.file_name}")
        print(f"  Страниц всего: {inspection.total_pages}")
        print(f"  Страниц с нормальным текстом: {inspection.pages_with_sufficient_text}")
        print(f"  Покрытие текстом: {inspection.text_coverage_percent:.1f}%")
        print(f"  Извлечено символов: {inspection.extracted_characters:,}")

        if inspection.pages_with_little_text:
            print(f"  Страницы с малым текстом: {inspection.pages_with_little_text}")

        if page_documents:
            sample_text = page_documents[0].page_content[:SAMPLE_LENGTH]
            print("  Начало первой текстовой страницы:")
            print(f"  {sample_text.replace(chr(10), ' ')}")

        print()

    print("ИТОГ")
    print(f"  Всего страниц: {total_pages}")
    print(f"  Документов до чанкирования: {total_documents}")
    print(f"  Извлечено символов: {total_characters:,}")


if __name__ == "__main__":
    main()