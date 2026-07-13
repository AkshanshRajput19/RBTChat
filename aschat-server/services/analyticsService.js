const Analytics = require('../models/Analytics');

class AnalyticsService {
  // Track when a chat session starts
  async startSession(userId, tenantId, customerData = {}) {
    const session = new Analytics({
      tenantId,
      userId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      startTime: new Date(),
      customerName: customerData.name || 'Anonymous',
      customerEmail: customerData.email || '',
      customerLocation: customerData.location || 'Unknown',
      funnelStage: customerData.isExistingCustomer ? 'active' : 'visitor'
    });
    await session.save();
    return session;
  }

  // Track when a message is sent
  async trackMessage(sessionId, messageData) {
    const session = await Analytics.findOne({ sessionId });
    if (!session) return null;

    if (messageData.sender === 'user') {
      session.messagesSent += 1;
    } else if (messageData.sender === 'customer') {
      session.messagesReceived += 1;
    }
    
    // Update funnel stage based on activity
    if (session.messagesSent >= 10) {
      session.funnelStage = 'active';
    }
    
    await session.save();
    return session;
  }

  // End a chat session
  async endSession(sessionId, analytics = {}) {
    const session = await Analytics.findOne({ sessionId });
    if (!session) return null;

    session.endTime = new Date();
    session.chatDuration = (session.endTime - session.startTime) / 1000;
    
    // Update with AI analysis
    if (analytics.sentiment) session.sentimentScore = analytics.sentiment;
    if (analytics.topics) session.topics = analytics.topics;
    if (analytics.satisfaction) session.satisfactionScore = analytics.satisfaction;
    if (analytics.leadScore) session.leadScore = analytics.leadScore;
    if (analytics.funnelStage) session.funnelStage = analytics.funnelStage;

    await session.save();
    return session;
  }

  // Get dashboard analytics
  async getDashboardAnalytics(tenantId, timeframe = 'week') {
    // Date filter
    const dateFilter = new Date();
    if (timeframe === 'week') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (timeframe === 'month') dateFilter.setMonth(dateFilter.getMonth() - 1);
    else if (timeframe === 'year') dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    else if (timeframe === 'today') dateFilter.setHours(0, 0, 0, 0);

    const analytics = await Analytics.find({
      tenantId,
      startTime: { $gte: dateFilter }
    });

    // Calculate metrics
    const totalSessions = analytics.length;
    const totalUsers = [...new Set(analytics.map(s => s.userId))].length;
    const totalMessages = analytics.reduce((sum, s) => 
      sum + s.messagesSent + s.messagesReceived, 0
    );
    
    // Average duration (in minutes)
    const avgDuration = analytics.reduce((sum, s) => 
      sum + s.chatDuration, 0
    ) / totalSessions || 0;
    
    // Sentiment analysis
    const avgSentiment = analytics.reduce((sum, s) => 
      sum + s.sentimentScore, 0
    ) / totalSessions || 0;
    
    // Peak hours
    const hourCounts = {};
    analytics.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, '0'
    );
    
    // Active chats (not ended)
    const activeChats = analytics.filter(s => !s.endTime).length;

    // Sales funnel
    const funnelStages = ['visitor', 'signup', 'active', 'premium', 'enterprise'];
    const funnel = {};
    funnelStages.forEach(stage => {
      funnel[stage] = analytics.filter(s => s.funnelStage === stage).length;
    });

    // Calculate conversion rates
    const conversionRates = {};
    for (let i = 0; i < funnelStages.length - 1; i++) {
      const current = funnelStages[i];
      const next = funnelStages[i + 1];
      if (funnel[current] > 0) {
        conversionRates[`${current}_to_${next}`] = 
          ((funnel[next] / funnel[current]) * 100).toFixed(1);
      }
    }

    // Customer behavior analysis
    const behavior = {
      avgMessagesPerSession: (totalMessages / totalSessions).toFixed(1),
      avgDurationMinutes: (avgDuration / 60).toFixed(1),
      mostActiveHour: `${peakHour}:00`,
      avgSentiment: (avgSentiment * 100).toFixed(1) + '%',
      returnRate: analytics.filter(s => s.funnelStage === 'active').length / totalUsers * 100 || 0
    };

    return {
      metrics: {
        totalUsers,
        activeChats,
        totalMessages,
        avgDuration: (avgDuration / 60).toFixed(1),
        avgSentiment: (avgSentiment * 100).toFixed(1) + '%',
        conversionRate: conversionRates.visitor_to_signup || 0
      },
      funnel,
      conversionRates,
      behavior,
      sessions: analytics.slice(0, 10) // Last 10 sessions
    };
  }

  // Predictive Sales Forecasting
  async predictSales(tenantId) {
    // Get last 3 months of data
    const dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 3);
    
    const analytics = await Analytics.find({
      tenantId,
      startTime: { $gte: dateFilter },
      purchaseAmount: { $gt: 0 }
    });

    if (analytics.length === 0) {
      return {
        forecast: 0,
        confidence: 0,
        message: 'Not enough data for prediction'
      };
    }

    // Calculate monthly revenue
    const monthlyRevenue = {};
    analytics.forEach(s => {
      const month = s.startTime.getMonth();
      const year = s.startTime.getFullYear();
      const key = `${year}-${month}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + s.purchaseAmount;
    });

    // Simple trend calculation (you can use ML for better accuracy)
    const months = Object.keys(monthlyRevenue).sort();
    const values = months.map(m => monthlyRevenue[m]);
    const avgGrowth = values.length > 1 
      ? (values[values.length - 1] - values[0]) / values.length 
      : 0;
    
    // Predict next month
    const lastMonthRevenue = values[values.length - 1] || 0;
    const predictedRevenue = lastMonthRevenue + avgGrowth * 1.2;
    const confidence = Math.min(85 + (values.length * 2), 95);

    // Identify best customers
    const topCustomers = {};
    analytics.forEach(s => {
      if (s.customerEmail) {
        topCustomers[s.customerEmail] = (topCustomers[s.customerEmail] || 0) + s.purchaseAmount;
      }
    });

    const sortedCustomers = Object.entries(topCustomers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      forecast: Math.round(predictedRevenue),
      confidence,
      growthRate: avgGrowth.toFixed(1),
      topCustomers: sortedCustomers.map(([email, amount]) => ({ email, amount })),
      monthlyTrend: months.map((month, i) => ({
        month,
        revenue: values[i]
      }))
    };
  }

  // Customer Behavior Analysis
  async analyzeCustomerBehavior(tenantId) {
    const analytics = await Analytics.find({ tenantId });

    if (analytics.length === 0) {
      return {
        message: 'Not enough data for analysis'
      };
    }

    // Common topics
    const topicCounts = {};
    analytics.forEach(s => {
      s.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Time patterns
    const hourActivity = {};
    analytics.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      hourActivity[hour] = (hourActivity[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // User segments
    const segments = {
      'High Value': analytics.filter(s => s.purchaseAmount > 500).length,
      'Medium Value': analytics.filter(s => s.purchaseAmount > 100 && s.purchaseAmount <= 500).length,
      'Low Value': analytics.filter(s => s.purchaseAmount > 0 && s.purchaseAmount <= 100).length,
      'Non-Purchasing': analytics.filter(s => s.purchaseAmount === 0).length
    };

    // Churn prediction (customers who haven't chatted in 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const atRisk = analytics.filter(s => 
      s.endTime && s.endTime < thirtyDaysAgo && s.funnelStage !== 'churned'
    ).length;

    return {
      topTopics: topTopics.map(([topic, count]) => ({ topic, count })),
      peakHours,
      segments,
      atRisk,
      totalCustomers: analytics.length,
      insights: [
        `Peak activity times: ${peakHours.join(', ')}`,
        `Top interest: ${topTopics[0]?.[0] || 'Unknown'}`,
        `${segments['High Value']} high-value customers identified`,
        `${atRisk} customers at risk of churning`
      ]
    };
  }
}

module.exports = new AnalyticsService();    