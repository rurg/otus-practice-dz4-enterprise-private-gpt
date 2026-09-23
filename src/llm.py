"""Фабрика языковых моделей Yandex AI Studio.

RAG, Streamlit и тестовые скрипты получают LLM только через get_llm().
Это позволяет позже переключить YandexGPT Pro на Qwen одной строкой в .env.
"""

from langchain_openai import ChatOpenAI

from .config import YC_API_KEY, YC_FOLDER_ID, YC_MODEL_ID


# OpenAI-совместимый endpoint Yandex AI Studio.
BASE_URL = "https://ai.api.cloud.yandex.net/v1"


def get_model_uri(model_id: str | None = None) -> str:
    """Собрать URI модели в формате, который ожидает Yandex AI Studio.

    model_id:
        Если передан — используем его только для текущего вызова.
        Если не передан — берём YC_MODEL_ID из .env.
    """

    selected_model_id = model_id or YC_MODEL_ID

    return f"gpt://{YC_FOLDER_ID}/{selected_model_id}"


def get_llm(model_id: str | None = None) -> ChatOpenAI:
    """Создать настроенную модель Yandex AI Studio.

    По умолчанию создаётся YandexGPT Pro 5.1.
    Для сравнения можно вызвать:
    get_llm("qwen3-235b-a22b-fp8")
    """

    return ChatOpenAI(
        model=get_model_uri(model_id),
        base_url=BASE_URL,
        api_key=YC_API_KEY,
        timeout=60,
        max_retries=2,
    )