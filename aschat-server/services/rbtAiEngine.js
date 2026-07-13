const POSITIVE_WORDS = [
  "great",
  "amazing",
  "awesome",
  "love",
  "happy",
  "excellent",
  "good",
  "nice",
  "thanks",
  "thank you",
  "glad",
  "perfect",
  "done",
  "cool",
  "beautiful",
  "best"
];

const NEGATIVE_WORDS = [
  "hate",
  "bad",
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
  "error",
  "failed",
  "fuck"
];

const COMMON_WORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "have",
  "just",
  "your",
  "you",
  "are",
  "the",
  "and",
  "but",
  "for",
  "not",
  "can",
  "will",
  "what",
  "when",
  "where",
  "there"
]);

const PHASE_2_STEPS = [
  {
    key: "chat-flow",
    title: "AI Chat Flow Engine",
    status: "active",
    description: "Reads recent chat context, detects intent, and generates smart replies."
  },
  {
    key: "sentiment",
    title: "Sentiment Analysis",
    status: "active",
    description: "Detects positive, negative, or neutral tone for personalized replies."
  },
  {
    key: "predictive",
    title: "Predictive Messaging",
    status: "active",
    description: "Learns your writing pattern and suggests replies before you type."
  },
  {
    key: "call-assistant",
    title: "Voice & Video AI Assistant",
    status: "browser-powered",
    description: "Uses browser speech tools for live transcript, translation helper, and tone labels during calls."
  }
];

const cleanText = (value) => String(value || "").trim();

const normalize = (value) => cleanText(value).toLowerCase();

const uniqueLimit = (items, limit = 3) => {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    const text = cleanText(item);
    const key = text.toLowerCase();

    if (text && !seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
  });

  return result.slice(0, limit);
};

const getRecentTextContext = (context = [], limit = 12) =>
  context
    .filter((message) => cleanText(message?.text))
    .slice(-limit)
    .map((message) => ({
      sender: cleanText(message.sender),
      text: cleanText(message.text)
    }));

const getLastText = (context = []) => {
  const textContext = getRecentTextContext(context, 20);
  return textContext.length ? textContext[textContext.length - 1].text : "";
};

const countMatches = (text, words) => {
  const normalized = normalize(text);
  return words.filter((word) => normalized.includes(word)).length;
};

const analyzeSentiment = (text = "") => {
  const positiveScore = countMatches(text, POSITIVE_WORDS);
  const negativeScore = countMatches(text, NEGATIVE_WORDS);
  let detectedSentiment = "neutral";

  if (positiveScore > negativeScore) detectedSentiment = "positive";
  if (negativeScore > positiveScore) detectedSentiment = "negative";

  return {
    detectedSentiment,
    positiveScore,
    negativeScore,
    confidence: Math.min(100, Math.abs(positiveScore - negativeScore) * 30 + 40)
  };
};

const detectIntent = (text = "") => {
  const value = normalize(text);

  if (!value) return "empty";
  if (/(thanks|thank you|thank)/.test(value)) return "thanks";
  if (/(help|need|can you|could you|please)/.test(value)) return "help";
  if (/(meeting|schedule|time|when|tomorrow|today|call|later)/.test(value)) return "schedule";
  if (/(project|work|update|progress|task|bug|code|build)/.test(value)) return "project";
  if (/(sorry|apolog|mistake)/.test(value)) return "apology";
  if (/(hello|hi|hey|hii|bro)/.test(value)) return "greeting";
  if (/(bye|goodbye|see you)/.test(value)) return "closing";
  if (value.includes("?")) return "question";
  return "general";
};

const getIntentLabel = (intent) => {
  const labels = {
    empty: "No message yet",
    thanks: "Thanks / appreciation",
    help: "Help request",
    schedule: "Planning / schedule",
    project: "Project / work",
    apology: "Apology",
    greeting: "Greeting",
    closing: "Closing",
    question: "Question",
    general: "General chat"
  };

  return labels[intent] || labels.general;
};

const getStyleLabel = (patterns) => {
  if (!patterns) return "Balanced";
  if (patterns.usesEmojis && !patterns.formalTone) return "Casual with emojis";
  if (patterns.formalTone) return "Formal";
  return "Casual";
};

const analyzeUserPatterns = (userMessages = []) => {
  const messages = userMessages
    .map((message) => cleanText(message?.text || message))
    .filter(Boolean);

  if (!messages.length) {
    return {
      averageLength: 0,
      commonStarters: [],
      commonEnders: [],
      frequentWords: [],
      usesEmojis: false,
      formalTone: false,
      sampleSize: 0
    };
  }

  const averageLength = Math.round(
    messages.reduce((sum, text) => sum + text.length, 0) / messages.length
  );

  const commonStarters = messages
    .map((text) => text.split(/\s+/)[0])
    .filter((word) => word && word.length > 1)
    .slice(0, 5);

  const commonEnders = messages
    .map((text) => {
      const words = text.split(/\s+/);
      return words[words.length - 1];
    })
    .filter((word) => word && word.length > 1)
    .slice(0, 5);

  const wordFrequency = {};
  messages
    .flatMap((text) => normalize(text).replace(/[^\w\s]/g, " ").split(/\s+/))
    .filter((word) => word.length > 3 && !COMMON_WORDS.has(word))
    .forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

  const frequentWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  const usesEmojis = messages.some((text) =>
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)
  );

  const casualMarkers = messages.filter((text) =>
    /\b(bro|bruh|ya|yeah|ok|lol|btw|gonna|wanna)\b/i.test(text)
  ).length;

  return {
    averageLength,
    commonStarters: uniqueLimit(commonStarters, 5),
    commonEnders: uniqueLimit(commonEnders, 5),
    frequentWords,
    usesEmojis,
    formalTone: casualMarkers < messages.length * 0.25,
    sampleSize: messages.length
  };
};

const buildSmartReplyTemplates = ({ intent, sentiment, targetUserName }) => {
  const name = cleanText(targetUserName) || "there";
  const positive = sentiment === "positive";
  const negative = sentiment === "negative";

  const repliesByIntent = {
    greeting: [
      `Hey ${name}! How are you?`,
      "Hi! Good to hear from you.",
      "Hello, what's up?"
    ],
    thanks: [
      "You're welcome!",
      "Anytime, happy to help.",
      "No problem, glad it helped."
    ],
    help: [
      "Of course, tell me exactly what you need.",
      "I can help with that. Share the details.",
      "Let's solve it step by step."
    ],
    schedule: [
      "Yes, let's plan a time.",
      "What time works best for you?",
      "I can do that. Confirm the timing?"
    ],
    project: [
      "Good progress. What's the next step?",
      "Let's focus on the main issue first.",
      "Send me the details and I'll check it."
    ],
    apology: [
      "No worries, it's okay.",
      "I understand. Let's move forward.",
      "It's fine, we can fix it."
    ],
    question: [
      "That's a good question. Let me explain.",
      "I think we should check the details first.",
      "Yes, I can help you figure it out."
    ],
    closing: [
      "Okay, talk soon.",
      "Take care!",
      "See you soon."
    ],
    general: [
      "Got it.",
      "That makes sense.",
      "Tell me more."
    ],
    empty: [
      "Start with a simple message.",
      "Ask me what you want to say.",
      "RBT-AI is ready when the chat starts."
    ]
  };

  const moodReplies = [];

  if (positive) {
    moodReplies.push("That's great to hear!");
    moodReplies.push("Nice, happy for you!");
  }

  if (negative) {
    moodReplies.push("I understand. Let's handle it calmly.");
    moodReplies.push("Sorry you're dealing with that. How can I help?");
  }

  return uniqueLimit([...moodReplies, ...(repliesByIntent[intent] || repliesByIntent.general)], 3);
};

const generateContextualReplies = ({ context = [], currentUserName = "", targetUserName = "" }) => {
  const recentContext = getRecentTextContext(context);
  const lastMessage = getLastText(recentContext);
  const sentiment = analyzeSentiment(lastMessage);
  const intent = detectIntent(lastMessage);
  const suggestions = buildSmartReplyTemplates({
    intent,
    sentiment: sentiment.detectedSentiment,
    targetUserName
  });

  return {
    success: true,
    suggestions,
    sentiment: sentiment.detectedSentiment,
    chatFlowAnalysis: {
      conversationLength: recentContext.length,
      detectedSentiment: sentiment.detectedSentiment,
      sentimentConfidence: sentiment.confidence,
      detectedIntent: intent,
      detectedIntentLabel: getIntentLabel(intent),
      respondingTo: lastMessage.slice(0, 80),
      currentUserName: cleanText(currentUserName),
      targetUserName: cleanText(targetUserName)
    },
    phase2Steps: PHASE_2_STEPS
  };
};

const predictReplies = ({ userMessages = [], lastRecipientMessage = "", userPatterns }) => {
  const patterns = userPatterns || analyzeUserPatterns(userMessages);
  const sentiment = analyzeSentiment(lastRecipientMessage);
  const intent = detectIntent(lastRecipientMessage);
  const predictions = [];

  if (intent === "question") {
    predictions.push("Let me check and tell you clearly.");
    predictions.push("Good question. I think the answer is...");
  }

  if (intent === "schedule") {
    predictions.push("Yes, that time works for me.");
    predictions.push("Let's do it tomorrow.");
    predictions.push("Tell me the exact time and place.");
  }

  if (intent === "project") {
    predictions.push("I'll check the project and update you.");
    predictions.push("Let's fix the main issue first.");
    predictions.push("Send me the latest screenshot or code.");
  }

  if (intent === "thanks") {
    predictions.push("Anytime bro!");
    predictions.push("You're welcome.");
  }

  if (sentiment.detectedSentiment === "negative") {
    predictions.push("I understand. Let's solve it step by step.");
    predictions.push("Don't worry, we'll fix it.");
  }

  if (sentiment.detectedSentiment === "positive") {
    predictions.push("That's awesome!");
    predictions.push("Great, let's continue.");
  }

  if (patterns.usesEmojis) {
    predictions.push("Sounds good 😊");
  }

  if (!patterns.formalTone) {
    predictions.push("Ok bro, got it.");
  }

  predictions.push("Got it.");
  predictions.push("Tell me more.");

  return {
    predictedReplies: uniqueLimit(predictions, 4),
    contextualInsight: {
      lastRecipientMessage: cleanText(lastRecipientMessage).slice(0, 100),
      detectedSentiment: sentiment.detectedSentiment,
      sentimentConfidence: sentiment.confidence,
      detectedIntent: intent,
      detectedIntentLabel: getIntentLabel(intent),
      communicationStyle: getStyleLabel(patterns),
      recentMessageCount: patterns.sampleSize || userMessages.length
    }
  };
};

const analyzeConversation = ({ context = [], draft = "" }) => {
  const textToAnalyze = cleanText(draft) || getLastText(context);
  const sentiment = analyzeSentiment(textToAnalyze);
  const intent = detectIntent(textToAnalyze);

  return {
    success: true,
    analysis: {
      text: textToAnalyze,
      detectedSentiment: sentiment.detectedSentiment,
      sentimentConfidence: sentiment.confidence,
      detectedIntent: intent,
      detectedIntentLabel: getIntentLabel(intent),
      recommendedAction:
        sentiment.detectedSentiment === "negative"
          ? "Reply gently and solve the issue step by step."
          : intent === "question"
            ? "Give a clear answer first, then ask a follow-up."
            : "Keep the reply short and natural."
    },
    phase2Steps: PHASE_2_STEPS
  };
};

module.exports = {
  PHASE_2_STEPS,
  analyzeConversation,
  analyzeSentiment,
  analyzeUserPatterns,
  detectIntent,
  generateContextualReplies,
  predictReplies
};
