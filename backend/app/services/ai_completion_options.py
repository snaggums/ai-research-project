_DEFAULT_TEMPERATURE_MODEL_PREFIXES = ("gpt-5", "o1", "o3", "o4")
_PROVIDER_ALIASES = {"azure_openai": "azure"}


def completion_model_options(
    provider: str,
    model: str,
    *,
    temperature: float = 0.2,
) -> dict[str, float | str]:
    """Return explicit provider routing and supported sampling options."""
    normalized_provider = provider.strip().lower().replace(" ", "_")
    options: dict[str, float | str] = {
        "custom_llm_provider": _PROVIDER_ALIASES.get(normalized_provider, normalized_provider)
    }
    normalized_model = model.strip().lower().rsplit("/", 1)[-1]
    requires_default_temperature = normalized_model.startswith(_DEFAULT_TEMPERATURE_MODEL_PREFIXES)
    if not requires_default_temperature:
        options["temperature"] = temperature
    return options
