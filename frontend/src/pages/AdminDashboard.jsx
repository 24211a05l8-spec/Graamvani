import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Users, PhoneCall, Radio, MessageSquare, ChevronRight, Play, FileText, Download, BarChart3, Bell, Cast } from 'lucide-react';
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
    // Auto-refresh every 30 seconds for live feel
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
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const QUICK_ACTIONS = [
    { title: 'Create Bulletin', desc: 'Auto-generate from news seed', icon: <FileText size={20} />, path: '/admin/bulletins' },
    { title: 'Farmer Directory', desc: 'Bulk upload / Manage list', icon: <Users size={20} />, path: '#' },
    { title: 'Detailed Analytics', desc: 'View Impact & Trends', icon: <BarChart3 size={20} />, path: '/admin/analytics' },
  ];

  const statCards = [
    { label: 'Total Registered Farmers', value: stats.totalFarmers?.toLocaleString() || '0', change: '+12% this month', icon: <Users size={20} />, color: 'var(--primary)' },
    { label: 'Total Calls Today', value: stats.callsToday?.toLocaleString() || '0', change: 'Peak: 7 AM - 9 AM', icon: <PhoneCall size={20} />, color: 'var(--accent)' },
    { label: 'Active Bulletins', value: stats.activeBulletins?.toLocaleString() || '0', change: '8 Districts covered', icon: <Radio size={20} />, color: 'var(--purple)' },
    { label: 'Avg Listen Time', value: stats.listenTime || '0m', change: '85% completion rate', icon: <BarChart3 size={20} />, color: 'var(--accent-light)' },
  ];

  return (
    <div className="admin-dashboard container">
      <header className="dashboard-header animate-fadein">
        <div>
          <h1 className="dashboard-title">System Overview</h1>
          <p className="dashboard-sub">Welcome back, Admin. Here's what's happening in Bharat today.</p>
        </div>
        <div className="header-actions">
          <div className="last-sync">
            <span className="status-dot online"></span>
            Last Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button className="btn btn-primary btn-sm" onClick={fetchData} disabled={loading}>
            {loading ? 'Syncing...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid-4 stats-row animate-fadein">
        {statCards.map((stat) => (
          <div className="card stat-card" key={stat.label}>
            <div className="stat-card-header">
              <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <span className="stat-change">{stat.change}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid animate-fadein">
        {/* Notifications and Alerts */}
        <div className="dashboard-main">
          <div className="card table-card">
            <div className="card-header">
              <h3>System Notifications</h3>
              <button className="btn btn-ghost btn-sm">Mark All Read</button>
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="empty-state">No new notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div className={`notification-item ${notif.isRead ? 'read' : 'unread'}`} key={notif.id}>
                    <div className="notif-icon">
                      <Bell size={18} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-header">
                        <h4>{notif.title}</h4>
                        <span className="notif-time">
                          {notif.createdAt && new Date(notif.createdAt._seconds * 1000 || notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p>{notif.message}</p>
                    </div>
                    {!notif.isRead && <div className="unread-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card table-card" style={{marginTop: '24px'}}>
            <div className="card-header">
              <h3>Live Call Feed</h3>
              <span className="live-indicator">LIVE</span>
            </div>
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Village</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.length === 0 ? (
                    <tr><td colSpan="5" className="empty-table">No recent calls found. Use the simulator to trigger one!</td></tr>
                  ) : (
                    recentCalls.map((call) => (
                      <tr key={call.id}>
                        <td>{call.village}</td>
                        <td className="phone-cell">XXXX-XXX-{call.fromRaw?.slice(-3)}</td>
                        <td>
                          <span className="badge badge-green">Completed</span>
                        </td>
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

        {/* Sidebar Actions */}
        <div className="dashboard-sidebar">
          <div className="card simulate-card">
            <div className="simulate-header">
              <h3>IVR Simulator</h3>
              <Activity size={18} />
            </div>
            <p>Generate a mock interaction to test your analytics and live feed.</p>
            <button 
              className={`btn btn-accent w-full ${simulating ? 'loading' : ''}`} 
              onClick={simulateCall}
              disabled={simulating}
            >
              <Cast size={16} /> {simulating ? 'Calling...' : 'Simulate Demo Call'}
            </button>
          </div>

          <div className="card actions-card" style={{marginTop: '24px'}}>
            <h3>Quick Actions</h3>
            <div className="actions-list">
              {QUICK_ACTIONS.map((action) => (
                <div className="action-item" key={action.title} onClick={() => action.path !== '#' && navigate(action.path)} style={{cursor: action.path !== '#' ? 'pointer' : 'default'}}>
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-info">
                    <h4>{action.title}</h4>
                    <p>{action.desc}</p>
                  </div>
                  <ChevronRight size={16} className="action-arrow" />
                </div>
              ))}
            </div>
          </div>

          <div className="card upgrade-card" style={{marginTop: '24px'}}>
            <div className="upgrade-icon">
              <TrendingUp size={24} />
            </div>
            <h4>Village Registration</h4>
            <p>You have {stats.pendingRegistrations} pending registration requests. Review and activate them to scale impact.</p>
            <button className="btn btn-primary btn-sm w-full" style={{marginTop: '12px', width: '100%', justifyContent: 'center'}}>
              {stats.pendingRegistrations > 0 ? 'Review Requests' : 'All Caught Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
