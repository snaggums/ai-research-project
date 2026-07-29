from app.core.config import settings as app_settings
from app.schemas.chat import ChatCitation, ChatResponse
from app.schemas.search import SearchResult
from app.services import ai_settings_service, search_service
from app.services.ai_completion_options import completion_model_options
from sqlalchemy.orm import Session


def answer_project_question(db: Session, project_id: str, question: str, limit: int = 6) -> ChatResponse:
    clean_question = question.strip()
    if not clean_question:
        raise ValueError("Ask a question before starting chat.")

    citations = [
        _citation_from_search_result(result)
        for result in search_service.search_project_chunks(db, project_id, clean_question, limit)
    ]
    if not citations:
        raise ValueError("No processed chunks were found for this project. Upload and process documents before chatting.")

    settings = ai_settings_service.get_or_create_settings(db)
    provider = settings.provider
    used_mock = provider.strip().lower() == "mock" or not settings.has_api_key
    answer = (
        _mock_answer(clean_question, citations)
        if used_mock
        else _answer_with_litellm(
            provider=provider,
            model=settings.model,
            base_url=settings.base_url,
            question=clean_question,
            citations=citations,
        )
    )
    message = "Answered with local mock RAG." if used_mock else f"Answered with {provider}."

    return ChatResponse(
        question=clean_question,
        answer=answer,
        citations=citations,
        provider=provider,
        model=settings.model,
        used_mock=used_mock,
        message=message,
    )


def _answer_with_litellm(
    provider: str,
    model: str,
    base_url: str | None,
    question: str,
    citations: list[ChatCitation],
    supplemental_context: str | None = None,
) -> str:
    try:
        from litellm import completion
    except ImportError as exc:
        raise ValueError("Install backend requirements before using live AI chat.") from exc

    context = "\n\n".join(
        f"[{index}] {citation.document_name}, chunk {citation.chunk_index + 1}, score {citation.score:.2f}\n{citation.text}"
        for index, citation in enumerate(citations, start=1)
    )
    interpretation_context = (
        (
            "\n\nInterpretation context from reviewed synthesis. Use it to understand "
            "the Record, but support every factual claim with the numbered primary "
            f"transcript excerpts below:\n{supplemental_context}"
        )
        if supplemental_context
        else ""
    )
    messages = [
        {
            "role": "system",
            "content": (
                "You are a UX research assistant. Answer only from the supplied context. "
                "Cite evidence inline using bracket numbers like [1]. If the context does not support an answer, say so."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Question: {question}{interpretation_context}"
                f"\n\nPrimary transcript evidence:\n{context}"
            ),
        },
    ]
    try:
        response = completion(
            model=model,
            messages=messages,
            api_key=_api_key_for_provider(provider),
            api_base=base_url,
            **completion_model_options(provider, model),
        )
    except Exception as exc:
        raise ValueError(
            f"Live chat failed for provider '{provider}' and model '{model}'. "
            "Confirm the model is available to your account and the provider key is valid. "
            f"Provider error: {_clean_provider_error(exc)}"
        ) from exc

    answer = response.choices[0].message.content
    if not answer:
        raise ValueError("The AI provider returned an empty chat answer. Try again or switch to mock provider.")
    return answer.strip()


def _mock_answer(question: str, citations: list[ChatCitation]) -> str:
    top_citations = citations[:3]
    cited_patterns = " ".join(f"[{index}]" for index in range(1, len(top_citations) + 1))
    summary = " ".join(_short_sentence(citation.text) for citation in top_citations)
    return (
        f"Based on the retrieved project evidence, the answer to '{question}' is most supported by "
        f"these transcript excerpts: {summary} {cited_patterns}"
    )


def _citation_from_search_result(result: SearchResult) -> ChatCitation:
    return ChatCitation(
        chunk_id=result.chunk_id,
        document_id=result.document_id,
        document_name=result.document_name,
        chunk_index=result.chunk_index,
        text=result.text,
        score=round(max(0.0, min(1.0, result.score)), 2),
    )


def _api_key_for_provider(provider: str) -> str | None:
    normalized = provider.strip().lower().replace(" ", "_")
    return {
        "openai": app_settings.openai_api_key,
        "anthropic": app_settings.anthropic_api_key,
        "gemini": app_settings.gemini_api_key,
        "openrouter": app_settings.openrouter_api_key,
        "azure": app_settings.azure_openai_api_key,
        "azure_openai": app_settings.azure_openai_api_key,
    }.get(normalized)


def _clean_provider_error(exc: Exception) -> str:
    message = str(exc).strip().replace("\n", " ")
    if not message:
        return exc.__class__.__name__
    return message[:500]


def _short_sentence(text: str, max_length: int = 220) -> str:
    clean = " ".join(text.split())
    if len(clean) <= max_length:
        return clean
    return f"{clean[: max_length - 3].rstrip()}..."
