"""Конфигурация Enterprise Private GPT.

Здесь проект читает .env и проверяет обязательные настройки.
Остальной код не должен обращаться к os.getenv() напрямую.
"""

import os
from pathlib import Path

from dotenv import load_dotenv


# Файл находится в src/config.py.
# Поднимаемся на два уровня: src → корень репозитория ДЗ4.
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Загружаем .env именно из корня проекта.
# override=False: системные переменные окружения имеют приоритет над .env.
load_dotenv(PROJECT_ROOT / ".env", override=False)


def get_required_env(variable_name: str) -> str:
    """Вернуть обязательную переменную или завершить работу с понятной ошибкой."""

    value = os.getenv(variable_name)

    if not value:
        raise RuntimeError(
            f"Не задана переменная {variable_name}. "
            "Проверь файл .env в корне проекта."
        )

    return value


# Обязательные данные для доступа к Yandex AI Studio.
YC_API_KEY = get_required_env("YC_API_KEY")
YC_FOLDER_ID = get_required_env("YC_FOLDER_ID")

# Явный ID модели, а не устаревающий алиас yandexgpt/latest.
# Его можно поменять в .env без изменения Python-кода.
YC_MODEL_ID = os.getenv("YC_MODEL_ID", "yandexgpt-5.1")