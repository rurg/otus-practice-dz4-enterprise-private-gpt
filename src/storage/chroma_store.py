"""Локальное хранение и поиск чанков в Chroma."""

from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings

from ..config import PROJECT_ROOT
from ..ingestion.pdf_loader import find_pdf_files, load_pdf_pages
from ..processing.chunker import split_documents


DB_PATH = PROJECT_ROOT / "data" / "chroma"
COLLECTION_NAME = "books_bge_m3"


def get_store(embeddings: Embeddings) -> Chroma:
    """Открывает коллекцию; Chroma сохраняет её в папке проекта."""
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(DB_PATH),
    )


def main() -> None:
    # Для первой проверки берём только страницу 25 книги Девлин.
    pdf_path = next(path for path in find_pdf_files() if "Девлин" in path.name)
    pages, _ = load_pdf_pages(pdf_path)
    page_25 = [page for page in pages if page.metadata["page"] == 25]
    chunks = split_documents(page_25)

    print("Загружаю BGE-M3 и открываю Chroma...", flush=True)
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-m3",
        encode_kwargs={"normalize_embeddings": True},
    )
    store = get_store(embeddings)

    # Стабильные ID позволяют повторно запустить проверку без новых копий чанков.
    store.add_documents(
        documents=chunks,
        ids=[chunk.metadata["chunk_id"] for chunk in chunks],
    )
    print(f"Добавлено чанков страницы 25: {len(chunks)}", flush=True)

    question = "Чем адаптивный агент отличается от статичной LLM?"
    for result in store.similarity_search(question, k=2):
        print(f"\n{result.metadata['source']}, страница {result.metadata['page']}")
        print(result.page_content[:400])


if __name__ == "__main__":
    main()