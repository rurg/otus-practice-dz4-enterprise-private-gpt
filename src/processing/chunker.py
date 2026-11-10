"""
Чанкирование страниц PDF для RAG.

Вход: LangChain Document для каждой непустой страницы PDF.
Выход: более короткие смысловые фрагменты — чанки.
"""

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Первая рабочая гипотеза для технических книг.
# Значения измеряются в символах, потому что стандартная длина
# в RecursiveCharacterTextSplitter считается через len(text).
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150

# Сплиттер будет пробовать разделители по порядку:
# сначала сохранять абзацы, затем строки, затем предложения.
# Только если это невозможно — резать по словам или символам.
SEPARATORS = [
    "\n\n",
    "\n",
    ". ",
    "? ",
    "! ",
    "; ",
    ": ",
    " ",
    "",
]


def split_documents(
    documents: list[Document],
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[Document]:
    """
    Разбивает страницы PDF на чанки и добавляет метаданные чанка.

    Каждый созданный чанк наследует source и page от исходной страницы.
    Дополнительно получает номер внутри страницы и стабильный chunk_id.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=SEPARATORS,
    )

    # LangChain сам переносит metadata исходной страницы в каждый чанк.
    chunks = splitter.split_documents(documents)

    # Счётчик нужен, чтобы нумеровать чанки отдельно на каждой странице.
    chunks_per_page: dict[tuple[str, int], int] = {}

    for chunk in chunks:
        source = chunk.metadata["source"]
        page = chunk.metadata["page"]

        # Ключ объединяет имя файла и номер страницы.
        page_key = (source, page)

        # .get(..., 0) означает: если такой страницы ещё не было,
        # начать счётчик с нуля.
        chunk_number = chunks_per_page.get(page_key, 0) + 1
        chunks_per_page[page_key] = chunk_number

        chunk.metadata["chunk_in_page"] = chunk_number

        # Этот ID будет одинаковым при повторной индексации
        # с тем же корпусом и теми же параметрами чанкирования.
        chunk.metadata["chunk_id"] = (
            f"{source}::recursive_{chunk_size}_{chunk_overlap}"
            f"::page_{page}::chunk_{chunk_number}"
        )

        # Сохраняем параметры, с которыми был создан чанк.
        # Это понадобится для сравнения конфигураций позже.
        chunk.metadata["chunking_strategy"] = (
            f"recursive_{chunk_size}_{chunk_overlap}"
        )

    return chunks