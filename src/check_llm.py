"""Проверка подключения к модели (ввиду того, что после атак в инфре яндекса твориться хз что ."""

from langchain_core.messages import HumanMessage


def main() -> None:
    """Отправить один короткий запрос и вывести ответ."""

    try:
        # Импортируем внутри try, чтобы красиво обработать и ошибку .env.
        from .llm import get_llm, get_model_uri

        print(f"Проверяем модель: {get_model_uri()}")

        # Создаём модель через единый модуль проекта.
        llm = get_llm()

        # HumanMessage — сообщение пользователя в формате LangChain.
        response = llm.invoke(
            [
                HumanMessage(
                    content=(
                        "Как называется столица Франции? "
                        "Ответь одним словом по-русски."
                        "Так же ответь, какая ты модель? название?"
                    )
                )
            ]
        )

        # Обычно content — строка. str() оставляет скрипт устойчивым,
        # если провайдер когда-нибудь вернёт другой допустимый формат.
        print("\nОтвет модели:")
        print(str(response.content))

    except Exception as error:
        # Печатаем тип и описание ошибки.
        print("\nПроверка не прошла.")
        print(f"{type(error).__name__}: {error}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()