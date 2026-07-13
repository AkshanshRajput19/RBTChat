const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const {
  PHASE_2_STEPS,
  analyzeUserPatterns: analyzeRbtUserPatterns,
  generateContextualReplies: generateRbtAiSuggestions,
  predictReplies: predictRbtAiReplies
} = require("../services/rbtAiEngine");

const router = express.Router();

router.use(authMiddleware);

router.get("/phase2", (req, res) => {
  return res.json({
    success: true,
    title: "RBT-AI Phase 2",
    subtitle: "AI Chat Flow, Sentiment Analysis, Predictive Messaging, and Call Assistant",
    steps: PHASE_2_STEPS
  });
});

// WRITING PATTERN ANALYSIS - extract user's communication style
const analyzeUserPatterns = (userMessages) => {
  if (!userMessages || userMessages.length === 0) {
    return {
      averageLength: 0,
      commonStarters: [],
      commonEnders: [],
      frequentWords: [],
      usesEmojis: false,
      formalTone: false
    };
  }

  // Calculate average message length
  const averageLength = Math.round(
    userMessages.reduce((sum, msg) => sum + (msg.text || "").length, 0) / userMessages.length
  );

  // Extract message starters and enders
  const starters = userMessages
    .map(msg => (msg.text || "").split(" ")[0])
    .filter(w => w.length > 2)
    .slice(0, 5);

  const enders = userMessages
    .map(msg => {
      const words = (msg.text || "").split(" ");
      return words[words.length - 1];
    })
    .filter(w => w.length > 2)
    .slice(0, 5);

  // Extract frequently used words (min 3 chars, excluding common words)
  const commonWords = ["the", "and", "but", "that", "this", "with", "from", "about", "have", "just"];
  const allWords = userMessages
    .flatMap(msg => (msg.text || "").toLowerCase().split(/\s+/))
    .filter(w => w.length > 3 && !commonWords.includes(w));
  
  const wordFreq = {};
  allWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const frequentWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Check for emoji usage
  const emojiRegex = /(\u00ad|\u0700[\u0020-\u019F]|\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f])/g;
  const usesEmojis = userMessages.some(msg => emojiRegex.test(msg.text || ""));

  // Detect formal vs casual tone (presence of contractions, punctuation)
  const contractions = userMessages.filter(msg => /don't|can't|won't|shouldn't|couldn't/i.test(msg.text || "")).length;
  const formalTone = contractions < userMessages.length * 0.3;

  return {
    averageLength,
    commonStarters: starters,
    commonEnders: enders,
    frequentWords,
    usesEmojis,
    formalTone
  };
};

// PREDICTIVE MESSAGING ENGINE - predict next message based on history
const predictiveMessaging = (userMessages, recipientLastMessage, userPatterns, sentiment) => {
  const predictions = [];
  const recipientTopic = (recipientLastMessage || "").toLowerCase();

  // Pattern 1: Respond to questions with user's typical opening
  if (recipientTopic.includes("?")) {
    const questionWords = recipientTopic.split("?")[0].split(" ");
    const questionType = 
      recipientTopic.includes("how") ? "inquiry" :
      recipientTopic.includes("what") ? "inquiry" :
      recipientTopic.includes("why") ? "inquiry" :
      recipientTopic.includes("when") ? "temporal" :
      "general";

    if (questionType === "inquiry") {
      predictions.push("That's a good question! Let me think about it...");
    } else if (questionType === "temporal") {
      predictions.push("Let me get back to you on that timing.");
    }
  }

  // Pattern 2: Mirror user's communication style
  if (userPatterns.formalTone) {
    predictions.push("I appreciate your message. I'll provide a thorough response.");
  } else if (userPatterns.usesEmojis) {
    predictions.push("Got it! 😊 Thanks for letting me know.");
  }

  // Pattern 3: Respond based on sentiment
  if (sentiment === "positive") {
    predictions.push("That's awesome! Glad to hear it went well.");
    predictions.push("Love that! Keep me posted on how things go.");
  } else if (sentiment === "negative") {
    predictions.push("I'm here to help. What can I do to make it better?");
    predictions.push("Sorry to hear that. Let's work through this together.");
  }

  // Pattern 4: Anticipate needs based on context
  if (recipientTopic.includes("project") || recipientTopic.includes("work")) {
    predictions.push("Let's sync up on this. When works best for you?");
    predictions.push("I can help with that. Do you need anything specific?");
  } else if (recipientTopic.includes("later") || recipientTopic.includes("tomorrow")) {
    predictions.push("Sounds good! I'll check in with you then.");
    predictions.push("Got it. I'll touch base later.");
  } else if (recipientTopic.includes("thank")) {
    predictions.push("Anytime! Happy to help.");
    predictions.push("You got it! Glad I could assist.");
  }

  // Pattern 5: Continue topic-based conversations
  if (recipientTopic.includes("meeting")) {
    predictions.push("Should we set up a time to discuss this?");
    predictions.push("What time works best for you?");
  } else if (recipientTopic.includes("update")) {
    predictions.push("What's the latest on your end?");
    predictions.push("Anything new to share?");
  }

  // Return top 3 unique predictions
  return [...new Set(predictions)].slice(0, 3);
};

// AI Chat Flow Engine - analyzes context and generates smart replies
const generateContextualReplies = (context, sentiment, currentUserName, targetUserName) => {
  const replies = [];
  
  // Analyze recent messages for context
  const lastMessage = context.length > 0 ? context[context.length - 1].text : "";
  const conversationTopic = lastMessage.toLowerCase();

  // Sentiment-aware base responses
  const sentimentBase = {
    positive: {
      greeting: `Thanks for the kind words! 😊 How are things going with you?`,
      question: `That sounds great! Tell me more about it.`,
      closing: `Really happy to hear that! Let's catch up soon.`
    },
    negative: {
      greeting: `I understand. Everything alright? Let me know if I can help.`,
      question: `I hear you. What's going on?`,
      closing: `Hang in there. We can talk through this.`
    },
    neutral: {
      greeting: `Got it! What's new?`,
      question: `Can you tell me more about that?`,
      closing: `Sounds good. Let me know!`
    }
  };

  // Contextual Smart Replies based on message content
  if (conversationTopic.includes("?")) {
    replies.push(sentimentBase[sentiment].question);
  }
  
  if (conversationTopic.includes("hello") || conversationTopic.includes("hi")) {
    replies.push(`Hey ${targetUserName}! Great to hear from you.`);
  }
  
  if (conversationTopic.includes("thanks") || conversationTopic.includes("thank")) {
    replies.push("You're welcome! Anytime. 😊");
  }

  if (conversationTopic.includes("help")) {
    replies.push(`Of course! I'm here to help. What do you need?`);
  }

  if (conversationTopic.includes("how are")) {
    const sentiments = {
      positive: "Doing great, thanks for asking!",
      negative: "Could be better. How about you?",
      neutral: "I'm doing fine. How are you?"
    };
    replies.push(sentiments[sentiment]);
  }

  // Default fallback replies
  if (replies.length === 0) {
    replies.push(sentimentBase[sentiment].greeting);
    replies.push(`That's interesting! Tell me more.`);
  }

  return replies.slice(0, 3);
};

// PHASE 2: CONTEXTUAL SUGGESTIONS - Main AI endpoint
router.post("/suggestions", async (req, res) => {
  try {
    const currentUserName = String(req.body.currentUserName || "").trim();
    const targetUserName = String(req.body.targetUserName || "").trim();
    const context = Array.isArray(req.body.context) ? req.body.context : [];

    if (!currentUserName || !targetUserName) {
      return res.status(400).json({
        success: false,
        message: "Missing conversation participant names."
      });
    }

    const aiResponse = generateRbtAiSuggestions({
      currentUserName,
      targetUserName,
      context,
    });

    return res.json(aiResponse);
  } catch (error) {
    console.error("AI suggestions error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate AI suggestions right now."
    });
  }
});

// PHASE 3: PREDICTIVE MESSAGING - Anticipate needs before user types
router.post("/predictive", async (req, res) => {
  try {
    const userId = req.userId;
    const targetUserId = String(req.body.targetUserId || "").trim();

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required."
      });
    }

    const userMessages = await Message.find({
      sender: userId,
      receiver: targetUserId,
      type: "text"
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("text");

    const lastRecipientMessage = await Message.findOne({
      sender: targetUserId,
      receiver: userId,
      type: "text"
    })
      .sort({ createdAt: -1 })
      .select("text");

    const recipientLastText = lastRecipientMessage?.text || "";
    const userPatterns = analyzeRbtUserPatterns(
      userMessages.map((message) => ({ text: message.text }))
    );

    const aiResponse = predictRbtAiReplies({
      userMessages: userMessages.map((message) => ({ text: message.text })),
      lastRecipientMessage: recipientLastText,
      userPatterns,
    });

    return res.json({
      ...aiResponse,
      userPatterns,
      contextualInsight: {
        ...(aiResponse.contextualInsight || {}),
        communicationStyle: userPatterns.formalTone ? "Formal" : "Casual",
        recentMessageCount: userMessages.length,
      },
    });
  } catch (error) {
    console.error("Predictive messaging error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate predictive suggestions right now."
    });
  }
});

module.exports = router;

