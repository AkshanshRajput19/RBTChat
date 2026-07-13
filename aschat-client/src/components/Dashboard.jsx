import PaymentButton from './PaymentButton';
import { useEffect, useState } from "react";
import api from "../api";

function Dashboard({ currentUser, onOpenChats }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeChats: 0, 
    messagesToday: 0,
    revenue: 0,
    premiumUsers: 0,
    conversionRate: 0
  });

  const [salesFunnel, setSalesFunnel] = useState({
    visitors: 0,
    signups: 0,
    activeUsers: 0,
    premium: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [dashboardData, setDashboardData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("week");

  // Mock data - replace with API calls later
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        activeChats: 342,
        messagesToday: 5678,
        revenue: 12450,
        premiumUsers: 89,
        conversionRate: 7.2
      });

      setSalesFunnel({
        visitors: 5000,
        signups: 1250,
        activeUsers: 342,
        premium: 89
      });

      setRecentActivity([
        { id: 1, action: 'New premium subscription', user: 'John Doe', time: '2 mins ago', type: 'subscription' },
        { id: 2, action: 'AI chatbot resolved ticket', user: 'Sarah K.', time: '15 mins ago', type: 'ai' },
        { id: 3, action: 'Sales forecast updated', user: 'System', time: '1 hour ago', type: 'system' },
        { id: 4, action: 'New user registered', user: 'Mike R.', time: '2 hours ago', type: 'user' },
        { id: 5, action: 'Appointment scheduled', user: 'Lisa M.', time: '3 hours ago', type: 'appointment' }
      ]);

      setAiInsights([
        {
          id: 1,
          type: 'sales',
          title: '📈 Sales Forecast',
          message: 'Predicted 28% growth this month based on chat patterns',
          confidence: '92%'
        },
        {
          id: 2,
          type: 'behavior',
          title: '👤 Customer Behavior',
          message: 'Peak engagement: 8-10 PM. Most active: 25-35 age group',
          confidence: '87%'
        },
        {
          id: 3,
          type: 'support',
          title: '🤖 Support Bot Performance',
          message: '85% of queries resolved automatically. Top issue: Account setup',
          confidence: '94%'
        }
      ]);

      setIsLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (!currentUser?.tenantId) return;
    fetchAnalyticsData();
  }, [currentUser, timeframe]);

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const [dashboardRes, forecastRes, behaviorRes] = await Promise.all([
        api.get(`/analytics/dashboard/${currentUser.tenantId}`, {
          params: { timeframe },
        }),
        api.get(`/analytics/forecast/${currentUser.tenantId}`),
        api.get(`/analytics/behavior/${currentUser.tenantId}`),
      ]);

      setDashboardData(dashboardRes.data);
      setForecastData(forecastRes.data);
      setBehaviorData(behaviorRes.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const plans = [
    { id: 'free', name: 'Free', price: '$0', features: ['Basic chat', '5 users', 'Support bot (limited)'] },
    { id: 'premium', name: 'Premium', price: '$29/mo', features: ['All features', '50 users', 'AI insights', 'Sales forecasting'] },
    { id: 'enterprise', name: 'Enterprise', price: '$99/mo', features: ['Unlimited users', 'Custom AI', 'Dedicated support', 'API access'] }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <h2>📊 Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-home" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {/* Header with Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>📊 Business Dashboard</h1>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['today', 'week', 'month', 'year'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid #292d3a',
                  background: timeframe === t ? '#4f46e5' : 'transparent',
                  color: timeframe === t ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-primary"
            onClick={onOpenChats}
          >
            💬 Open Chats
          </button>
          <button className="btn-secondary">📥 Export Report</button>
        </div>
      </div>
       {analyticsLoading ? (
  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
    Loading analytics data...
  </div>
) : dashboardData ? (
  <>
    {/* Real Stats Grid */}
    <div className="dashboard-stats-grid">
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-icon">👥</div>
        <div className="dashboard-stat-info">
          <h3>{dashboardData.metrics?.totalUsers || 0}</h3>
          <p>Total Users</p>
        </div>
      </div>
      
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-icon">💬</div>
        <div className="dashboard-stat-info">
          <h3>{dashboardData.metrics?.activeChats || 0}</h3>
          <p>Active Chats</p>
        </div>
      </div>
      
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-icon">📨</div>
        <div className="dashboard-stat-info">
          <h3>{dashboardData.metrics?.totalMessages || 0}</h3>
          <p>Total Messages</p>
        </div>
      </div>
      
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-icon">⏱️</div>
        <div className="dashboard-stat-info">
          <h3>{dashboardData.metrics?.avgDuration || 0} min</h3>
          <p>Avg Chat Duration</p>
        </div>
      </div>

      <div className="dashboard-stat-card">
        <div className="dashboard-stat-icon">😊</div>
        <div className="dashboard-stat-info">
          <h3>{dashboardData.metrics?.avgSentiment || 'N/A'}</h3>
          <p>Customer Sentiment</p>
        </div>
      </div>
    </div>

    {/* Real Sales Funnel */}
    {dashboardData.funnel && (
      <div className="dashboard-section">
        <h2><span className="section-icon">📈</span> Real Sales Funnel</h2>
        <div className="funnel-container">
          {Object.entries(dashboardData.funnel).map(([stage, count]) => (
            <div key={stage} className="funnel-step">
              <div className="funnel-label">
                <span>{stage.toUpperCase()}</span>
                <span className="funnel-count">{count}</span>
              </div>
              <div className="funnel-bar-wrapper">
                <div className="funnel-bar" style={{ 
                  width: `${(count / (dashboardData.funnel?.visitor || 1)) * 100}%`,
                  background: stage === 'visitor' ? '#4f46e5' : 
                            stage === 'signup' ? '#7c3aed' :
                            stage === 'active' ? '#8b5cf6' : '#a78bfa'
                }}></div>
              </div>
            </div>
          ))}
        </div>
        <div className="funnel-stats">
          <span>Conversion: <strong>{dashboardData.conversionRates?.visitor_to_signup || 0}%</strong></span>
          <span>Return Rate: <strong>{dashboardData.behavior?.returnRate || 0}%</strong></span>
        </div>
      </div>
    )}

    {/* AI Forecast */}
    {forecastData && (
      <div className="dashboard-section">
        <h2><span className="section-icon">🤖</span> AI Sales Forecast</h2>
        <div className="insights-grid">
          <div className="insight-card" style={{ borderLeftColor: '#4ade80' }}>
            <div className="insight-header">
              <h4>📊 Revenue Forecast</h4>
              <span className="insight-confidence">🔵 {forecastData.confidence || 0}%</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80' }}>
              ${forecastData.forecast || 0}
            </p>
            <p>Next month predicted revenue</p>
            <div className="insight-footer">
              <span className="insight-type">Growth: {forecastData.growthRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Customer Behavior */}
    {behaviorData && (
      <div className="dashboard-section">
        <h2><span className="section-icon">👤</span> Customer Behavior Analysis</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>🔝 Top Topics</h4>
            {behaviorData.topTopics?.slice(0, 4).map((topic, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>#{topic.topic}</span>
                <span style={{ color: '#4f46e5' }}>{topic.count} chats</span>
              </div>
            ))}
          </div>
          <div className="insight-card">
            <h4>⏰ Peak Hours</h4>
            {behaviorData.peakHours?.map((hour, i) => (
              <div key={i} style={{ padding: '4px 0' }}>
                <span>🕐 {hour}</span>
              </div>
            ))}
          </div>
          <div className="insight-card" style={{ borderLeftColor: '#f87171' }}>
            <h4>⚠️ At Risk Customers</h4>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>
              {behaviorData.atRisk || 0}
            </p>
            <p>Inactive for 30+ days</p>
          </div>
        </div>
        <div style={{ marginTop: '12px', padding: '12px', background: '#1e293b', borderRadius: '8px' }}>
          <h4 style={{ color: '#4f46e5', margin: '0 0 6px 0' }}>💡 AI Insights</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '14px' }}>
            {behaviorData.insights?.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>
    )}
  </>
) : null}
      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card"> 
          <div className="dashboard-stat-icon">👥</div>
          <div className="dashboard-stat-info">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className="dashboard-stat-change positive">+12% this month</span>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">💬</div>
          <div className="dashboard-stat-info">
            <h3>{stats.activeChats}</h3>
            <p>Active Chats</p>
            <span className="dashboard-stat-change positive">+8% this week</span>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">📨</div>
          <div className="dashboard-stat-info">
            <h3>{stats.messagesToday.toLocaleString()}</h3>
            <p>Messages Today</p>
            <span className="dashboard-stat-change positive">+15% vs yesterday</span>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">💰</div>
          <div className="dashboard-stat-info">
            <h3>${stats.revenue.toLocaleString()}</h3>
            <p>Revenue (MRR)</p>
            <span className="dashboard-stat-change positive">+5.2% growth</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">⭐</div>
          <div className="dashboard-stat-info">
            <h3>{stats.premiumUsers}</h3>
            <p>Premium Users</p>
            <span className="dashboard-stat-change positive">{stats.conversionRate}% conversion</span>
          </div>
        </div>
      </div>

      {/* Sales Funnel */}
      <div className="dashboard-section">
        <h2><span className="section-icon">📈</span> Sales Funnel Tracking</h2>
        <div className="funnel-container">
          <div className="funnel-step">
            <div className="funnel-label">
              <span>👀 Visitors</span>
              <span className="funnel-count">{salesFunnel.visitors}</span>
            </div>
            <div className="funnel-bar-wrapper">
              <div className="funnel-bar" style={{ width: '100%', background: '#4f46e5' }}></div>
            </div>
          </div>
          <div className="funnel-step">
            <div className="funnel-label">
              <span>📝 Signups</span>
              <span className="funnel-count">{salesFunnel.signups}</span>
            </div>
            <div className="funnel-bar-wrapper">
              <div className="funnel-bar" style={{ width: '25%', background: '#7c3aed' }}></div>
            </div>
          </div>
          <div className="funnel-step">
            <div className="funnel-label">
              <span>⚡ Active Users</span>
              <span className="funnel-count">{salesFunnel.activeUsers}</span>
            </div>
            <div className="funnel-bar-wrapper">
              <div className="funnel-bar" style={{ width: '6.8%', background: '#8b5cf6' }}></div>
            </div>
          </div>
          <div className="funnel-step">
            <div className="funnel-label">
              <span>💎 Premium</span>
              <span className="funnel-count">{salesFunnel.premium}</span>
            </div>
            <div className="funnel-bar-wrapper">
              <div className="funnel-bar" style={{ width: '1.8%', background: '#a78bfa' }}></div>
            </div>
          </div>
        </div>
        <div className="funnel-stats">
          <span>Conversion Rate: <strong>{stats.conversionRate}%</strong></span>
          <span>Drop-off Rate: <strong>{(100 - stats.conversionRate).toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="dashboard-section">
        <h2><span className="section-icon">💳</span> Subscription Plans</h2>
        <div className="plans-grid">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`plan-card ${selectedPlan === plan.id ? 'plan-selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <h3>{plan.name}</h3>
              <div className="plan-price">{plan.price}</div>
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✅ {feature}</li>
                ))}
              </ul>
              <PaymentButton 
    amount={plan.id === 'premium' ? 29 : 99}
    planName={plan.name}
/>
            </div>
          ))}
        </div>
      </div>

      {/* AI Business Insights */}
      <div className="dashboard-section">
        <h2><span className="section-icon">🤖</span> AI Business Insights</h2>
        <div className="insights-grid">
          {aiInsights.map((insight) => (
            <div key={insight.id} className="insight-card">
              <div className="insight-header">
                <h4>{insight.title}</h4>
                <span className="insight-confidence">🔵 {insight.confidence}</span>
              </div>
              <p>{insight.message}</p>
              <div className="insight-footer">
                <span className="insight-type">{insight.type}</span>
                <button className="insight-action">View Details →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Support Bot */}
      <div className="dashboard-section">
        <h2><span className="section-icon">🤖</span> AI Powered Customer Support</h2>
        <div className="support-card">
          <div className="support-stats">
            <div>
              <span className="support-number">85%</span>
              <p>Auto-resolved</p>
            </div>
            <div>
              <span className="support-number">2.3s</span>
              <p>Avg response time</p>
            </div>
            <div>
              <span className="support-number">94%</span>
              <p>Satisfaction rate</p>
            </div>
          </div>
          <div className="support-actions">
            <button className="btn-primary">⚡ Configure Bot</button>
            <button className="btn-secondary">📊 View Analytics</button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section" style={{ marginBottom: 0 }}>
        <h2><span className="section-icon">🔄</span> Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.map((item) => (
            <div key={item.id} className={`activity-item ${item.type}`}>
              <div className="activity-dot"></div>
              <div className="activity-content">
                <strong>{item.action}</strong>
                <span> - {item.user}</span>
                <span className="activity-time">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
