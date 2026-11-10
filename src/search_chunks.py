"""Проверка числа записей и поиск фрагментов по всем книгам."""

import chromadb
from langchain_huggingface import HuggingFaceEmbeddings

from .storage.chroma_store import COLLECTION_NAME, DB_PATH, get_store


def main() -> None:
    # Считаем записи прямо в сохранённой базе, без повторной индексации.
    client = chromadb.PersistentClient(path=str(DB_PATH))
    collection = client.get_collection(COLLECTION_NAME)
    print(f"Чанков в Chroma: {collection.count()}")

    question = input("Вопрос по книгам: ").strip()
    if not question:
        return

    print("Загружаю BGE-M3 и ищу фрагменты...", flush=True)
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-m3",
        encode_kwargs={"normalize_embeddings": True},
    )
    store = get_store(embeddings)

    for number, chunk in enumerate(store.similarity_search(question, k=3), 1):
        print(
            f"\n{number}. {chunk.metadata['source']}, "
            f"PDF-страница {chunk.metadata['page']}"
        )
        print(chunk.page_content[:500])


if __name__ == "__main__":
    main()