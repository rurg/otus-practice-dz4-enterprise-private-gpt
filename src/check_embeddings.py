"""Проверка локальной модели эмбеддингов BGE-M3."""

from langchain_huggingface import HuggingFaceEmbeddings


def main() -> None:
    print("Загружаю BGE-M3. При первом запуске модель скачивается...", flush=True)

    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-m3",
        encode_kwargs={"normalize_embeddings": True},
    )

    question = "Что такое RAG?"
    texts = [
        "RAG дополняет ответ языковой модели фрагментами найденных документов.",
        "Для яблочного пирога понадобятся яблоки и тесто.",
    ]

    # Получаем вектор вопроса и векторы двух текстов.
    query_vector = embeddings.embed_query(question)
    text_vectors = embeddings.embed_documents(texts)

    print(f"Размерность вектора: {len(query_vector)}")
    for text, vector in zip(texts, text_vectors):
        # Для нормализованных векторов скалярное произведение показывает близость.
        similarity = sum(a * b for a, b in zip(query_vector, vector))
        print(f"Близость: {similarity:.3f} — {text}")


if __name__ == "__main__":
    main()