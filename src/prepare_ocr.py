"""Однократно распознаёт PDF с неполным текстовым слоем."""

import json

import pymupdf

from .config import PROJECT_ROOT
from .ingestion.pdf_loader import find_pdf_files


# OCR-текст храним отдельно от исходного PDF и не добавляем в Git.
OUTPUT_PATH = (
    PROJECT_ROOT / "data" / "processed" / "private" / "generative_ai_ocr.jsonl"
)


def main() -> None:
    # Находим нужную книгу среди PDF в data/raw/private.
    pdf_path = next(
        path for path in find_pdf_files()
        if path.name.startswith("Генератив")
    )

    # Создаём папку для результата, если её ещё нет.
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Оба файла закроются автоматически после выхода из блока with.
    with pymupdf.open(pdf_path) as pdf, OUTPUT_PATH.open(
        "w", encoding="utf-8"
    ) as output:
        # enumerate(..., start=1) даёт привычные номера страниц: 1, 2, 3...
        for page_number, page in enumerate(pdf, start=1):
            # Распознаём всю страницу. Обычное извлечение пропускало
            # русские абзацы даже там, где находило отдельные слова.
            text_page = page.get_textpage_ocr(
                language="rus+eng",
                dpi=200,
                full=True,
            )

            # Получаем обычную строку из результата распознавания.
            text = page.get_text("text", textpage=text_page).strip()

            # Формат JSONL: одна строка файла содержит номер и текст
            # одной страницы. Так мы сохраним ссылки на страницы для RAG.
            record = {"page": page_number, "text": text}
            output.write(
                json.dumps(record, ensure_ascii=False) + "\n"
            )

            # Показываем ход долгой обработки, но не печатаем каждую страницу.
            if page_number % 50 == 0 or page_number == len(pdf):
                print(f"Распознано страниц: {page_number}/{len(pdf)}")

    print(f"Текст сохранён: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()