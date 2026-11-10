"""Индексация всех PDF-книг в локальной Chroma."""

from langchain_huggingface import HuggingFaceEmbeddings

from .ingestion.pdf_loader import find_pdf_files, load_pdf_pages
from .processing.chunker import split_documents
from .storage.chroma_store import get_store


BATCH_SIZE = 32


def main() -> None:
    print("Загружаю BGE-M3 и открываю Chroma...", flush=True)
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-m3",
        encode_kwargs={"normalize_embeddings": True},
    )
    store = get_store(embeddings)

    total = 0

    for pdf_path in find_pdf_files():
        pages, _ = load_pdf_pages(pdf_path)
        chunks = split_documents(pages)
        print(f"\n{pdf_path.name}: {len(chunks)} чанков", flush=True)

        # Небольшие пачки ограничивают нагрузку на память и показывают ход работы.
        for start in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[start : start + BATCH_SIZE]
            store.add_documents(
                documents=batch,
                ids=[chunk.metadata["chunk_id"] for chunk in batch],
            )
            print(f"  Сохранено: {start + len(batch)}/{len(chunks)}", flush=True)

        total += len(chunks)

    print(f"\nИтого обработано чанков: {total}")


if __name__ == "__main__":
    main()