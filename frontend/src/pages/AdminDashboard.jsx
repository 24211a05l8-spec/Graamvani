import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  TrendingUp, Users, PhoneCall, Radio, MessageSquare, ChevronRight, 
  Play, FileText, Download, BarChart3, Bell, Cast, Zap, Activity 
} from 'lucide-react';
import './AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFarmers: 0,
    callsToday: 0,
    activeBulletins: 0,
    pendingRegistrations: 0,
    listenTime: '0m'
  });
  const [notifications, setNotifications] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, notificationsRes, callsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stats`),
        axios.get(`${API_BASE_URL}/notifications`),
        axios.get(`${API_BASE_URL}/calls/recent`)
      ]);
      setStats(statsRes.data);
      setNotifications(notificationsRes.data);
      setRecentCalls(callsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const simulateCall = async () => {
    setSimulating(true);
    try {
      const villages = ['Rampur', 'Khedi', 'Muzaffarpur', 'Katihar', 'Purnia'];
      const actions = ['News Bulletin', 'Weather Update', 'Market Prices', 'Expert Advice'];
      const payload = {
        village: villages[Math.floor(Math.random() * villages.length)],
        action: actions[Math.floor(Math.random() * actions.length)]
      };
      await axios.post(`${API_BASE_URL}/debug/simulate-call`, payload);
      await fetchData();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const statCards = [
    { label: 'Registered Farmers', value: stats.totalFarmers?.toLocaleString() || '12,482', trend: '+12%', icon: <Users size={20} />, color: 'var(--primary)' },
    { label: 'Today\'s Call Volume', value: stats.callsToday?.toLocaleString() || '842', trend: '+8%', icon: <PhoneCall size={20} />, color: 'var(--accent)' },
    { label: 'Digital Bulletins', value: stats.activeBulletins?.toLocaleString() || '24', trend: 'Active', icon: <Radio size={20} />, color: 'var(--purple)' },
    { label: 'Impact Reach', value: '42.8k', trend: '94%', icon: <Zap size={20} />, color: 'var(--accent-light)' },
  ];

  return (
    <div className="admin-dashboard container animate-fadein">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Bharat <span className="gradient-text">Overview</span></h1>
          <p className="dashboard-sub">Real-time gateway monitoring and cluster management.</p>
        </div>
        <div className="header-actions">
          <div className="last-sync">
            <span className="dot pulse"></span>
            Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid-4 metric-row-dash">
        {statCards.map((stat, i) => (
          <div className="card metric-dash-card" key={i}>
            <div className="metric-dash-icon" style={{ color: stat.color, background: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <div className="metric-dash-info">
              <span className="metric-dash-label">{stat.label}</span>
              <div className="metric-dash-val-wrap">
                <span className="metric-dash-value">{stat.value}</span>
                <span className="metric-dash-trend">{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* Notifications Card */}
          <div className="card list-card">
            <div className="list-card-header">
              <h3>System Notifications</h3>
              <button className="btn btn-ghost btn-sm">Clear All</button>
            </div>
            <div className="notifications-list-dash">
              {notifications.length === 0 ? (
                <div className="empty-state">No new alerts</div>
              ) : (
                notifications.map((notif) => (
                  <div className={`notif-dash-item ${notif.isRead ? 'read' : 'unread'}`} key={notif.id}>
                    <div className="notif-dash-icon"><Bell size={16} /></div>
                    <div className="notif-dash-body">
                      <h4>{notif.title}</h4>
                      <p>{notif.message}</p>
                      <span className="notif-dash-time">
                        {notif.createdAt && new Date(notif.createdAt._seconds * 1000 || notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!notif.isRead && <div className="notif-dash-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Feed Card */}
          <div className="card list-card" style={{marginTop: '24px'}}>
            <div className="list-card-header">
              <h3>Live Cluster Feed</h3>
              <div className="live-indicator-dash">LIVE</div>
            </div>
            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Cluster</th>
                    <th>Node ID</th>
                    <th>Status</th>
                    <th>Stamp</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.length === 0 ? (
                    <tr><td colSpan="5" className="empty-table">Standing by for cluster data...</td></tr>
                  ) : (
                    recentCalls.map((call) => (
                      <tr key={call.id}>
                        <td><strong>{call.village}</strong></td>
                        <td className="phone-cell">Node-{call.fromRaw?.slice(-4)}</td>
                        <td><span className="badge-dash green">ACTIVE</span></td>
                        <td>{new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{call.duration || '2m 14s'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar">
          {/* Simulator Card */}
          <div className="card simulate-card-dash">
            <div className="sim-header">
              <h3>IVR Sandbox</h3>
              <Zap size={16} className="text-primary" />
            </div>
            <p>Generate mock cluster activity to verify real-time monitoring and analytics paths.</p>
            <button 
              className={`btn btn-primary w-full ${simulating ? 'loading' : ''}`} 
              onClick={simulateCall}
              disabled={simulating}
            >
              <Cast size={16} /> {simulating ? 'Broadcasting...' : 'Simulate Activity'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="card nav-card" style={{marginTop: '24px'}}>
            <h3>Core Tools</h3>
            <div className="nav-list">
              <div className="nav-item" onClick={() => navigate('/admin/bulletins')}>
                <div className="nav-icon"><FileText size={18} /></div>
                <div className="nav-text">
                  <h4>Bulletin Studio</h4>
                  <p>AI Voice Generation</p>
                </div>
                <ChevronRight size={14} />
              </div>
              <div className="nav-item" onClick={() => navigate('/admin/analytics')}>
                <div className="nav-icon"><BarChart3 size={18} /></div>
                <div className="nav-text">
                  <h4>Deep Analytics</h4>
                  <p>Impact & ROI Tracking</p>
                </div>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Registration Monitor */}
          <div className="card alert-card" style={{marginTop: '24px'}}>
            <div className="alert-header">
              <Activity size={20} className="text-accent" />
              <h4>Onboarding Monitor</h4>
            </div>
            <p><strong>{stats.pendingRegistrations}</strong> villages are currently awaiting system activation.</p>
            <button className="btn btn-accent btn-sm w-full" style={{marginTop: '12px', width: '100%', justifyContent: 'center'}}>
              Review Network Requests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
