# Ticket 29: [M-26] Model fallback middleware

## What it asks
Feature. Add the prebuilt model-fallback middleware with a second model taken from config.
Done when: with the primary model forced to fail, the reply still arrives from the fallback; both model names come from config.

## What's ambiguous
Nothing ambiguous. `config.model` (`AI_MODEL`) and `config.fallbackModel` (`AI_FALLBACK_MODEL`) already exist from M-02, and `langchain` ships `modelFallbackMiddleware`.

## First step
Wire `modelFallbackMiddleware` into `createBaseAgent`.

## Clarifying questions
No ambiguity: the ticket and existing config fully determine the change.
