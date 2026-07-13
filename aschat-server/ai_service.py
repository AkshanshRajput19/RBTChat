import json
from typing import List, Dict, Any


def analyze_sentiment(text: str) -> str:
    t = (text or "").lower()
    positive_words = ["great", "amazing", "awesome", "love", "happy", "excellent", "good", "wonderful", "nice", "thanks", "thank you", "glad", "perfect", "good job", "done"]
    negative_words = ["hate", "bad", "awful", "terrible", "sad", "angry", "frustrated", "disappointed", "wrong", "problem", "issue", "help", "sorry", "stress", "worried", "difficult"]

    positive_count = sum(1 for word in positive_words if word in t)
    negative_count = sum(1 for word in negative_words if word in t)

    if positive_count > negative_count:
        return "positive"
    if negative_count > positive_count:
        return "negative"
    return "neutral"


def detect_intent(text: str) -> str:
    t = (text or "").lower()
    if any(word in t for word in ["thanks", "thank you", "thank"]):
        return "thanks"
    if any(word in t for word in ["help", "need", "can you", "could you"]):
        return "help"
    if any(word in t for word in ["meeting", "schedule", "time", "when", "tomorrow", "today", "call"]):
        return "schedule"
    if any(word in t for word in ["project", "work", "update", "progress", "task"]):
        return "project"
    if any(word in t for word in ["sorry", "apolog", "mistake"]):
        return "apology"
    if any(word in t for word in ["hello", "hi", "hey"]):
        return "greeting"
    if "?" in t:
        return "question"
    if any(word in t for word in ["bye", "goodbye", "see you"]):
        return "closing"
    return "general"


def build_reply_templates(intent: str, sentiment: str, target_name: str) -> List[str]:
    templates = {
        "greeting": [
            f"Hey {target_name}! Great to hear from you.",
            f"Hi {target_name}, what would you like to talk about today?",
            f"Hello! I am ready to help you with this conversation.",
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
        last_message = str(context[-1].get("text", "") or "")

    intent = detect_intent(last_message)
    replies = build_reply_templates(intent, sentiment, target_user_name)

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


def process_ai_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    context = payload.get("context", []) or []
    current_user_name = str(payload.get("currentUserName", "") or "").strip()
    target_user_name = str(payload.get("targetUserName", "") or "").strip()
    last_message = ""
    if context:
        last_message = str(context[-1].get("text", "") or "")

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
    last_recipient_message = str(payload.get("lastRecipientMessage", "") or "")
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


if __name__ == "__main__":
    import sys

    request_type = sys.argv[1] if len(sys.argv) > 1 else "suggestions"
    payload = json.loads(sys.stdin.read() or "{}")

    if request_type == "predictive":
        result = process_predictive_request(payload)
    else:
        result = process_ai_request(payload)

    print(json.dumps(result))
