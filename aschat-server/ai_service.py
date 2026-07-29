import ast
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib import error, parse, request

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None


BASE_DIR = Path(__file__).resolve().parent
GEMINI_PROVIDER = "gemini"

SYSTEM_PROMPT = (
    "You are RBT AI, a reliable general-purpose assistant inside a chat application. "
    "Answer clearly, accurately, and helpfully. If the user asks for code, provide practical code. "
    "If the answer is uncertain, say so plainly. Keep responses well-structured but concise."
)

POSITIVE_WORDS = [
    "great",
    "amazing",
    "awesome",
    "love",
    "happy",
    "excellent",
    "good",
    "wonderful",
    "nice",
    "thanks",
    "thank you",
    "glad",
    "perfect",
    "good job",
    "done",
]

NEGATIVE_WORDS = [
    "hate",
    "bad",
    "awful",
    "terrible",
    "sad",
    "angry",
    "frustrated",
    "disappointed",
    "wrong",
    "problem",
    "issue",
    "help",
    "sorry",
    "stress",
    "worried",
    "difficult",
]


def load_environment() -> None:
    if load_dotenv is None:
        return

    for file_name in (".env.local", ".env"):
        file_path = BASE_DIR / file_name
        if file_path.exists():
            load_dotenv(file_path, override=False)


def clean_text(value: Any, limit: int = 16000) -> str:
    text = str(value or "").strip()
    return text[:limit]


def get_default_models() -> Dict[str, str]:
    return {
        GEMINI_PROVIDER: clean_text(os.getenv("GEMINI_MODEL"), 120)
        or clean_text(os.getenv("AI_MODEL"), 120)
        or "gemini-3.5-flash",
    }


def normalize_messages(messages: Any, limit: int = 20) -> List[Dict[str, str]]:
    if not isinstance(messages, list):
        return []

    normalized: List[Dict[str, str]] = []

    for message in messages[-limit:]:
        if not isinstance(message, dict):
            continue

        role = clean_text(message.get("role")).lower()
        if role not in {"system", "user", "assistant"}:
            continue

        content = clean_text(message.get("content") or message.get("text"))
        if not content:
            continue

        normalized.append({"role": role, "content": content})

    return normalized


def get_last_user_message(messages: List[Dict[str, str]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "user":
            return message.get("content", "")
    return ""


def suggest_title(messages: List[Dict[str, str]]) -> str:
    last_user_message = get_last_user_message(messages)
    if not last_user_message:
        return "New AI Chat"

    words = re.sub(r"\s+", " ", last_user_message).strip().split(" ")
    return " ".join(words[:6]).strip(" .,!?:;") or "New AI Chat"


def analyze_sentiment(text: str) -> str:
    lower_text = clean_text(text).lower()
    positive_count = sum(1 for word in POSITIVE_WORDS if word in lower_text)
    negative_count = sum(1 for word in NEGATIVE_WORDS if word in lower_text)

    if positive_count > negative_count:
        return "positive"
    if negative_count > positive_count:
        return "negative"
    return "neutral"


def detect_intent(text: str) -> str:
    lower_text = clean_text(text).lower()

    if any(word in lower_text for word in ["thanks", "thank you", "thank"]):
        return "thanks"
    if any(word in lower_text for word in ["help", "need", "can you", "could you"]):
        return "help"
    if any(word in lower_text for word in ["meeting", "schedule", "time", "when", "tomorrow", "today", "call"]):
        return "schedule"
    if any(word in lower_text for word in ["project", "work", "update", "progress", "task"]):
        return "project"
    if any(word in lower_text for word in ["sorry", "apolog", "mistake"]):
        return "apology"
    if any(word in lower_text for word in ["hello", "hi", "hey"]):
        return "greeting"
    if "?" in lower_text:
        return "question"
    if any(word in lower_text for word in ["bye", "goodbye", "see you"]):
        return "closing"
    return "general"


def build_reply_templates(intent: str, sentiment: str, target_name: str) -> List[str]:
    templates = {
        "greeting": [
            f"Hey {target_name}! Great to hear from you.",
            f"Hi {target_name}, what would you like to talk about today?",
            "Hello! I am ready to help you with this conversation.",
        ],
        "thanks": [
            "You are very welcome! Happy to help.",
            "Absolutely, glad I could help.",
            "My pleasure. Let me know if you need anything else.",
        ],
        "help": [
            "Of course. I can help with that. What do you need exactly?",
            "Happy to help. Tell me the details and I will guide you.",
            "I am here for it. Share what you need and I will support you.",
        ],
        "schedule": [
            "That sounds important. When would be a good time for you?",
            "We can sort that out quickly. What time works best?",
            "Let us plan it. I can help you choose a suitable time.",
        ],
        "project": [
            "Great, let us keep the momentum going. What is the latest update?",
            "I can help with that. What part do you want to focus on?",
            "Sounds like a productive task. Share the next step and I will help.",
        ],
        "apology": [
            "No worries. Thanks for letting me know.",
            "I understand. Let us fix it together.",
            "That is completely okay. What would you like to do next?",
        ],
        "question": [
            "That is a good question. Let me help you with it.",
            "Thanks for asking. I can help you think it through.",
            "I would be happy to help you with that.",
        ],
        "closing": [
            "Sounds good. Take care and talk soon.",
            "Perfect. I will catch up with you soon.",
            "Great, see you soon.",
        ],
        "general": [
            "That makes sense. What would you like to do next?",
            "I am following along. Tell me more if you want.",
            "Sounds good. I am here to help you keep the conversation moving.",
        ],
    }

    base = templates.get(intent, templates["general"])

    if sentiment == "negative":
        base = [
            "I understand. I am here to help you through it.",
            "That sounds difficult. Let us take it one step at a time.",
            "Thanks for sharing that. We can work through it together.",
        ] + base[:1]
    elif sentiment == "positive":
        base = [
            "That sounds great! I am glad to hear that.",
            "Excellent. Keep going, you are doing well.",
        ] + base[:1]

    return list(dict.fromkeys(base))[:3]


def generate_contextual_replies(context: List[Dict[str, Any]], sentiment: str, current_user_name: str, target_user_name: str) -> List[str]:
    last_message = ""
    if context:
        last_message = clean_text(context[-1].get("text", ""))

    intent = detect_intent(last_message)
    target_name = target_user_name or "there"
    replies = build_reply_templates(intent, sentiment, target_name)

    if intent == "general" and last_message:
        if len(last_message.split()) > 8:
            replies.append("That sounds detailed. Would you like a short summary of it?")
        else:
            replies.append("I am keeping up with the conversation. Tell me more if you want.")

    return list(dict.fromkeys(replies))[:3]


def predict_replies(context: List[Dict[str, Any]], last_recipient_message: str) -> List[str]:
    sentiment = analyze_sentiment(last_recipient_message)
    intent = detect_intent(last_recipient_message)
    replies = build_reply_templates(intent, sentiment, "them")

    if intent in {"schedule", "project"}:
        replies = [
            "I can help with that. What would make this easier for you?",
            "Let us make a clear plan for it.",
            "That sounds manageable. I can help you move it forward.",
        ] + replies[:1]
    elif intent == "question":
        replies = [
            "That is a good question. I can help you with a practical answer.",
            "I would respond with a clear and helpful explanation.",
        ] + replies[:1]

    return list(dict.fromkeys(replies))[:3]


def get_configured_providers() -> Dict[str, bool]:
    return {
        GEMINI_PROVIDER: bool(
            clean_text(os.getenv("GEMINI_API_KEY")) or clean_text(os.getenv("GOOGLE_API_KEY"))
        ),
    }


def resolve_provider(selected_provider: Optional[str]) -> Optional[str]:
    configured = get_configured_providers()
    requested = clean_text(selected_provider).lower()

    if requested and requested != GEMINI_PROVIDER:
        return None

    if configured.get(GEMINI_PROVIDER):
        return GEMINI_PROVIDER

    return None


def resolve_model(provider: Optional[str], requested_model: Optional[str]) -> str:
    default_models = get_default_models()
    requested = clean_text(requested_model, 120)
    if requested:
        return requested

    if provider in default_models:
        return default_models[provider]

    return default_models[GEMINI_PROVIDER]


def build_system_prompt(user_name: str, custom_prompt: str = "") -> str:
    prompt_parts = [SYSTEM_PROMPT]

    if user_name:
        prompt_parts.append(f"The current user is {user_name}.")

    if custom_prompt:
        prompt_parts.append(custom_prompt)

    return " ".join(part for part in prompt_parts if part).strip()


def http_json_request(
    *,
    url: str,
    payload: Dict[str, Any],
    headers: Dict[str, str],
    timeout_seconds: int = 90,
) -> Dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, headers=headers, method="POST")

    try:
        with request.urlopen(req, timeout=timeout_seconds) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            raw = response.read().decode(charset)
            return json.loads(raw or "{}")
    except error.HTTPError as exc:
        charset = exc.headers.get_content_charset() or "utf-8"
        details = exc.read().decode(charset, errors="replace")
        raise RuntimeError(f"HTTP {exc.code} from AI provider: {details}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"AI provider request failed: {exc.reason}") from exc


def extract_openai_content(response_json: Dict[str, Any]) -> str:
    if isinstance(response_json.get("output_text"), str):
        return clean_text(response_json["output_text"], 50000)

    choices = response_json.get("choices") or []
    if choices:
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return clean_text(content, 50000)

        if isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    parts.append(item.get("text", ""))
            return clean_text("\n".join(parts), 50000)

    return ""


def call_openai(messages: List[Dict[str, str]], model: str, system_prompt: str) -> Dict[str, Any]:
    api_key = clean_text(os.getenv("OPENAI_API_KEY"), 500)
    base_url = clean_text(os.getenv("OPENAI_BASE_URL"), 500) or "https://api.openai.com/v1"
    url = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "temperature": float(os.getenv("AI_TEMPERATURE") or 0.6),
        "messages": [{"role": "system", "content": system_prompt}] + messages,
    }

    response_json = http_json_request(
        url=url,
        payload=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    return {
        "answer": extract_openai_content(response_json),
        "usage": response_json.get("usage") or {},
        "raw": response_json,
    }


def call_anthropic(messages: List[Dict[str, str]], model: str, system_prompt: str) -> Dict[str, Any]:
    api_key = clean_text(os.getenv("ANTHROPIC_API_KEY"), 500)
    payload = {
        "model": model,
        "max_tokens": int(os.getenv("AI_MAX_TOKENS") or 1200),
        "temperature": float(os.getenv("AI_TEMPERATURE") or 0.6),
        "system": system_prompt,
        "messages": messages,
    }

    response_json = http_json_request(
        url="https://api.anthropic.com/v1/messages",
        payload=payload,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
    )

    parts = response_json.get("content") or []
    answer = "\n".join(
        item.get("text", "")
        for item in parts
        if isinstance(item, dict) and item.get("type") == "text"
    )

    return {
        "answer": clean_text(answer, 50000),
        "usage": response_json.get("usage") or {},
        "raw": response_json,
    }


def call_gemini(messages: List[Dict[str, str]], model: str, system_prompt: str) -> Dict[str, Any]:
    api_key = clean_text(os.getenv("GOOGLE_API_KEY"), 500) or clean_text(os.getenv("GEMINI_API_KEY"), 500)
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{parse.quote(model)}:generateContent"
    )

    contents = []
    for message in messages:
        role = "model" if message["role"] == "assistant" else "user"
        contents.append(
            {
                "role": role,
                "parts": [{"text": message["content"]}],
            }
        )

    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": float(os.getenv("AI_TEMPERATURE") or 0.6),
        },
    }

    response_json = http_json_request(
        url=url,
        payload=payload,
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
    )

    candidates = response_json.get("candidates") or []
    answer_parts: List[str] = []

    if candidates:
        content = candidates[0].get("content") or {}
        for part in content.get("parts") or []:
            if isinstance(part, dict):
                answer_parts.append(part.get("text", ""))

    return {
        "answer": clean_text("\n".join(answer_parts), 50000),
        "usage": response_json.get("usageMetadata") or {},
        "raw": response_json,
    }


def call_ollama(messages: List[Dict[str, str]], model: str, system_prompt: str) -> Dict[str, Any]:
    base_url = clean_text(os.getenv("OLLAMA_URL"), 500) or "http://127.0.0.1:11434"
    payload = {
        "model": model,
        "stream": False,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "options": {
            "temperature": float(os.getenv("AI_TEMPERATURE") or 0.6),
        },
    }

    response_json = http_json_request(
        url=f"{base_url.rstrip('/')}/api/chat",
        payload=payload,
        headers={
            "Content-Type": "application/json",
        },
    )

    return {
        "answer": clean_text((response_json.get("message") or {}).get("content", ""), 50000),
        "usage": {
            "prompt_eval_count": response_json.get("prompt_eval_count"),
            "eval_count": response_json.get("eval_count"),
        },
        "raw": response_json,
    }


def evaluate_basic_math(text: str) -> Optional[str]:
    expression = clean_text(text, 200)
    if not expression:
        return None

    match = re.search(r"([-+/*()%\d.\s]{3,})", expression)
    if not match:
        return None

    candidate = match.group(1).strip()
    if not candidate or re.search(r"[A-Za-z]", candidate):
        return None

    try:
        node = ast.parse(candidate, mode="eval")
    except SyntaxError:
        return None

    allowed_nodes = (
        ast.Expression,
        ast.BinOp,
        ast.UnaryOp,
        ast.Constant,
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.FloorDiv,
        ast.Mod,
        ast.Pow,
        ast.USub,
        ast.UAdd,
        ast.Load,
    )

    if not all(isinstance(item, allowed_nodes) for item in ast.walk(node)):
        return None

    try:
        result = eval(compile(node, "<math>", "eval"), {"__builtins__": {}}, {})
    except Exception:
        return None

    return f"The result is {result}."


def generate_local_fallback_answer(messages: List[Dict[str, str]], provider_warning: str) -> str:
    user_text = get_last_user_message(messages)
    lower_text = user_text.lower()

    math_answer = evaluate_basic_math(user_text)
    if math_answer:
        return math_answer

    if any(keyword in lower_text for keyword in ["react", "javascript", "python", "css", "html", "bug", "error", "code"]):
        return (
            "I can still help in local fallback mode. Connect Gemini first for full model answers. "
            "For now, share the code or error and I will help you debug it step by step.\n\n"
            f"Setup note: {provider_warning}"
        )

    if any(keyword in lower_text for keyword in ["summarize", "summary", "explain", "what is", "how does"]):
        return (
            "I am running without a remote model right now, so I cannot give full large-model answers yet. "
            "Configure Gemini in the backend env and I will answer this like a real assistant.\n\n"
            f"Setup note: {provider_warning}"
        )

    return (
        "RBT AI is connected, but Gemini is not configured yet. "
        "Add `GEMINI_API_KEY` or `GOOGLE_API_KEY` to turn this into a real AI chat experience.\n\n"
        f"Setup note: {provider_warning}"
    )


def run_provider(provider: str, messages: List[Dict[str, str]], model: str, system_prompt: str) -> Dict[str, Any]:
    if provider == GEMINI_PROVIDER:
        return call_gemini(messages, model, system_prompt)

    raise RuntimeError(f"Unsupported provider: {provider}")


def process_ai_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    context = payload.get("context", []) or []
    current_user_name = clean_text(payload.get("currentUserName"))
    target_user_name = clean_text(payload.get("targetUserName"))
    last_message = ""
    if context:
        last_message = clean_text(context[-1].get("text", ""))

    sentiment = analyze_sentiment(last_message)
    suggestions = generate_contextual_replies(context, sentiment, current_user_name, target_user_name)

    return {
        "success": True,
        "suggestions": suggestions,
        "sentiment": sentiment,
        "chatFlowAnalysis": {
            "conversationLength": len(context),
            "detectedSentiment": sentiment,
            "respondingTo": last_message[:50],
            "detectedIntent": detect_intent(last_message),
        },
    }


def process_predictive_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    context = payload.get("context", []) or []
    last_recipient_message = clean_text(payload.get("lastRecipientMessage"))
    predicted_replies = predict_replies(context, last_recipient_message)

    return {
        "success": True,
        "predictedReplies": predicted_replies,
        "contextualInsight": {
            "lastRecipientMessage": last_recipient_message[:60],
            "detectedSentiment": analyze_sentiment(last_recipient_message),
            "detectedIntent": detect_intent(last_recipient_message),
            "recentMessageCount": len(context),
        },
    }


def process_config_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    default_models = get_default_models()
    configured_providers = get_configured_providers()
    active_provider = resolve_provider(payload.get("provider"))
    model = resolve_model(active_provider, payload.get("model"))
    configured = active_provider is not None

    return {
        "success": True,
        "configured": configured,
        "provider": GEMINI_PROVIDER,
        "model": model,
        "mode": "remote" if configured else "local-fallback",
        "availableProviders": [
            {
                "id": GEMINI_PROVIDER,
                "configured": configured_providers.get(GEMINI_PROVIDER, False),
                "defaultModel": default_models.get(GEMINI_PROVIDER),
            }
        ],
        "setupSteps": [
            "Set GEMINI_API_KEY or GOOGLE_API_KEY in aschat-server/.env.local.",
            "Restart the backend after changing env values.",
            "Open the AI page again and send a prompt.",
        ],
        "capabilities": [
            "General Q&A",
            "Coding help",
            "Summaries",
            "Brainstorming",
        ],
    }


def process_chat_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    messages = normalize_messages(payload.get("messages"), limit=int(os.getenv("AI_MAX_HISTORY") or 20))
    current_user_name = clean_text(payload.get("currentUserName"), 120)
    requested_model = payload.get("model")
    custom_prompt = clean_text(payload.get("systemPrompt"), 2000)

    if not messages:
        return {
            "success": False,
            "message": "At least one chat message is required.",
        }

    provider = resolve_provider(GEMINI_PROVIDER)
    model = resolve_model(provider, requested_model)
    system_prompt = build_system_prompt(current_user_name, custom_prompt)
    provider_warning = (
        "Configure GEMINI_API_KEY or GOOGLE_API_KEY in aschat-server/.env.local, then restart the backend."
    )

    metadata = {
        "provider": GEMINI_PROVIDER,
        "model": model,
        "title": suggest_title(messages),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if provider is None:
        return {
            "success": True,
            "configured": False,
            "mode": "local-fallback",
            "answer": generate_local_fallback_answer(messages, provider_warning),
            "warning": provider_warning,
            **metadata,
        }

    try:
        provider_result = run_provider(provider, messages, model, system_prompt)
        answer = clean_text(provider_result.get("answer"), 50000)

        if not answer:
            raise RuntimeError("The AI provider returned an empty answer.")

        return {
            "success": True,
            "configured": True,
            "mode": "remote",
            "answer": answer,
            "usage": provider_result.get("usage") or {},
            **metadata,
        }
    except Exception as exc:
        return {
            "success": True,
            "configured": False,
            "mode": "local-fallback",
            "answer": generate_local_fallback_answer(messages, provider_warning),
            "warning": str(exc),
            **metadata,
        }


if __name__ == "__main__":
    load_environment()

    request_type = sys.argv[1] if len(sys.argv) > 1 else "suggestions"
    payload = json.loads(sys.stdin.read() or "{}")

    if request_type == "predictive":
        result = process_predictive_request(payload)
    elif request_type == "chat":
        result = process_chat_request(payload)
    elif request_type == "config":
        result = process_config_request(payload)
    else:
        result = process_ai_request(payload)

    print(json.dumps(result))
