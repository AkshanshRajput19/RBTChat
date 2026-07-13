const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// ===================== START SESSION =====================
router.post('/session', async (req, res) => {
  try {
    const { userId, tenantId, customerData } = req.body;

    const session = new Analytics({
      tenantId: tenantId || 'default',
      userId: userId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      startTime: new Date(),
      customerName: customerData?.name || 'Anonymous',
      customerEmail: customerData?.email || '',
      funnelStage: 'visitor',
      messagesSent: 0,
      messagesReceived: 0
    });

    await session.save();

    res.json({
      success: true,
      sessionId: session.sessionId,
      session: session
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== TRACK MESSAGE =====================
router.post('/message', async (req, res) => {
  try {
    const { sessionId, messageData } = req.body;

    const session = await Analytics.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (messageData?.sender === 'user') {
      session.messagesSent += 1;
    } else if (messageData?.sender === 'customer') {
      session.messagesReceived += 1;
    }

    // Update funnel stage based on activity
    if (session.messagesSent >= 10) {
      session.funnelStage = 'active';
    } else if (session.messagesSent >= 3) {
      session.funnelStage = 'signup';
    }

    await session.save();

    res.json({
      success: true,
      session: session
    });

  } catch (error) {
    console.error('Error tracking message:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== END SESSION =====================
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId, analytics } = req.body;

    const session = await Analytics.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.endTime = new Date();
    session.chatDuration = (session.endTime - session.startTime) / 1000;

    if (analytics?.sentiment) session.sentimentScore = analytics.sentiment;
    if (analytics?.topics) session.topics = analytics.topics;
    if (analytics?.satisfaction) session.satisfactionScore = analytics.satisfaction;
    if (analytics?.funnelStage) session.funnelStage = analytics.funnelStage;

    await session.save();

    res.json({
      success: true,
      session: session
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== GET DASHBOARD DATA =====================
router.get('/dashboard/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { timeframe = 'week' } = req.query;

    // Date filter
    const dateFilter = new Date();
    if (timeframe === 'today') dateFilter.setHours(0, 0, 0, 0);
    else if (timeframe === 'week') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (timeframe === 'month') dateFilter.setMonth(dateFilter.getMonth() - 1);
    else if (timeframe === 'year') dateFilter.setFullYear(dateFilter.getFullYear() - 1);

    const sessions = await Analytics.find({
      tenantId: tenantId,
      startTime: { $gte: dateFilter }
    });

    if (sessions.length === 0) {
      return res.json({
        metrics: {
          totalUsers: 0,
          activeChats: 0,
          totalMessages: 0,
          avgDuration: '0',
          avgSentiment: 'N/A'
        },
        funnel: { visitor: 0, signup: 0, active: 0, premium: 0, enterprise: 0 },
        conversionRates: { visitor_to_signup: '0' },
        behavior: { returnRate: '0' }
      });
    }

    // Calculate metrics
    const totalUsers = [...new Set(sessions.map(s => s.userId))].length;
    const activeChats = sessions.filter(s => !s.endTime).length;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messagesSent + s.messagesReceived, 0);
    const avgDuration = sessions.reduce((sum, s) => sum + s.chatDuration, 0) / sessions.length / 60 || 0;
    const avgSentiment = sessions.reduce((sum, s) => sum + s.sentimentScore, 0) / sessions.length * 100 || 0;

    // Funnel data
    const funnel = {
      visitor: sessions.filter(s => s.funnelStage === 'visitor').length,
      signup: sessions.filter(s => s.funnelStage === 'signup').length,
      active: sessions.filter(s => s.funnelStage === 'active').length,
      premium: sessions.filter(s => s.funnelStage === 'premium').length,
      enterprise: sessions.filter(s => s.funnelStage === 'enterprise').length
    };

    const visitorCount = funnel.visitor || 1;
    const conversionRates = {
      visitor_to_signup: ((funnel.signup / visitorCount) * 100).toFixed(1)
    };

    const returnRate = sessions.filter(s =>
      s.funnelStage === 'active' || s.funnelStage === 'premium'
    ).length / totalUsers * 100 || 0;

    res.json({
      metrics: {
        totalUsers,
        activeChats,
        totalMessages,
        avgDuration: avgDuration.toFixed(1),
        avgSentiment: avgSentiment > 0 ? `${avgSentiment.toFixed(1)}%` : 'N/A'
      },
      funnel,
      conversionRates,
      behavior: { returnRate: returnRate.toFixed(1) }
    });

  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== SALES FORECAST =====================
router.get('/forecast/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Get last 30 days of paid sessions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await Analytics.find({
      tenantId: tenantId,
      startTime: { $gte: thirtyDaysAgo },
      purchaseAmount: { $gt: 0 }
    });

    if (sessions.length === 0) {
      return res.json({
        forecast: 0,
        confidence: 0,
        growthRate: 0,
        message: 'Not enough data for prediction'
      });
    }

    const totalRevenue = sessions.reduce((sum, s) => sum + s.purchaseAmount, 0);
    const avgRevenue = totalRevenue / sessions.length;
    const predictedRevenue = avgRevenue * 30; // Project to 30 days

    res.json({
      forecast: Math.round(predictedRevenue),
      confidence: Math.min(85 + (sessions.length * 0.5), 95),
      growthRate: 5.2, // Mock growth rate
      message: 'Based on last 30 days of purchase data'
    });

  } catch (error) {
    console.error('Error getting forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== CUSTOMER BEHAVIOR =====================
router.get('/behavior/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const sessions = await Analytics.find({ tenantId: tenantId });

    if (sessions.length === 0) {
      return res.json({
        topTopics: [],
        peakHours: [],
        atRisk: 0,
        insights: ['No data available yet']
      });
    }

    // Top topics
    const topicCounts = {};
    sessions.forEach(s => {
      s.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    // Peak hours
    const hourCounts = {};
    sessions.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // At risk (inactive 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const atRisk = sessions.filter(s =>
      s.endTime && s.endTime < thirtyDaysAgo
    ).length;

    // Generate insights
    const insights = [
      `Peak activity: ${peakHours.join(', ')}`,
      topTopics.length > 0 ? `Top topic: ${topTopics[0].topic}` : 'No topics yet',
      `${atRisk} customers at risk of churning`
    ];

    res.json({
      topTopics,
      peakHours,
      atRisk,
      insights
    });

  } catch (error) {
    console.error('Error getting behavior:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;