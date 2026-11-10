"""Проверка размеров и содержимого чанков на реальных PDF."""

from statistics import median

from .ingestion.pdf_loader import find_pdf_files, load_pdf_pages
from .processing.chunker import CHUNK_OVERLAP, CHUNK_SIZE, split_documents


def main() -> None:
    print(f"Параметры: chunk_size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}")

    total_chunks = 0

    for pdf_path in find_pdf_files():
        # Загрузка и чанкирование пока выполняются локально, без эмбеддингов и БД.
        pages, _ = load_pdf_pages(pdf_path)
        chunks = split_documents(pages)
        lengths = [len(chunk.page_content) for chunk in chunks]
        total_chunks += len(chunks)

        print(f"\nФайл: {pdf_path.name}")
        print(f"  Текстовых страниц: {len(pages)}")
        print(f"  Чанков: {len(chunks)}")
        print(
            f"  Длина (мин / медиана / макс): "
            f"{min(lengths)} / {median(lengths):g} / {max(lengths)}"
        )
        print(f"  Чанков короче 200 символов: {sum(n < 200 for n in lengths)}")

        # Два соседних чанка позволяют глазами проверить границу и перекрытие.
        examples = [
            chunk for chunk in chunks
            if chunk.metadata["page"] == 25
        ][:2]

        for chunk in examples:
            print(
                f"\n  Страница {chunk.metadata['page']}, "
                f"чанк {chunk.metadata['chunk_in_page']}, "
                f"{len(chunk.page_content)} символов:"
            )
            print(chunk.page_content)

    print(f"\nИТОГО чанков: {total_chunks}")


if __name__ == "__main__":
    main()