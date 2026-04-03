import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Users, PhoneCall, Radio, MessageSquare, ChevronRight, Play, FileText, Download, BarChart3, Bell } from 'lucide-react';
import './AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const STAT_CARDS = [
  { label: 'Total Registered Farmers', value: '12,482', change: '+12% this month', icon: <Users size={20} />, color: 'var(--primary)' },
  { label: 'Total Calls Today', value: '842', change: 'Peak: 7 AM - 9 AM', icon: <PhoneCall size={20} />, color: 'var(--accent)' },
  { label: 'Active Bulletins', value: '24', change: '8 Districts covered', icon: <Radio size={20} />, color: 'var(--purple)' },
  { label: 'Avg Listen Time', value: '2m 45s', change: '85% completion rate', icon: <BarChart3 size={20} />, color: 'var(--accent-light)' },
];

const RECENT_CALLS = [
  { id: 1, village: 'Rampur', phone: '9827XXX123', status: 'Completed', time: '10:42 AM', duration: '3m 12s' },
  { id: 2, village: 'Khedi', phone: '7024XXX456', status: 'Completed', time: '10:38 AM', duration: '2m 45s' },
  { id: 3, village: 'Muzaffarpur', phone: '9111XXX789', status: 'Missed Call', time: '10:35 AM', duration: '-' },
  { id: 4, village: 'Rampur', phone: '9425XXX001', status: 'In Progress', time: '10:31 AM', duration: '1m 20s' },
];

const QUICK_ACTIONS = [
  { title: 'Create Bulletin', desc: 'Auto-generate from news seed', icon: <FileText size={20} />, path: '/admin/bulletins' },
  { title: 'Farmer Directory', desc: 'Bulk upload / Manage list', icon: <Users size={20} />, path: '#' },
  { title: 'Export Reports', desc: 'Download CSV analytics', icon: <Download size={20} />, path: '#' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFarmers: '...',
    callsToday: '...',
    activeBulletins: '...',
    pendingRegistrations: 0,
    listenTime: '...'
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, notificationsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/stats`),
          axios.get(`${API_BASE_URL}/notifications`)
        ]);
        setStats(statsRes.data);
        setNotifications(notificationsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Registered Farmers', value: stats.totalFarmers.toLocaleString(), change: '+12% this month', icon: <Users size={20} />, color: 'var(--primary)' },
    { label: 'Total Calls Today', value: stats.callsToday.toLocaleString(), change: 'Peak: 7 AM - 9 AM', icon: <PhoneCall size={20} />, color: 'var(--accent)' },
    { label: 'Active Bulletins', value: stats.activeBulletins.toLocaleString(), change: '8 Districts covered', icon: <Radio size={20} />, color: 'var(--purple)' },
    { label: 'Avg Listen Time', value: stats.listenTime, change: '85% completion rate', icon: <BarChart3 size={20} />, color: 'var(--accent-light)' },
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
            Last Sync: 10:45 AM
          </div>
          <button className="btn btn-primary btn-sm">Refresh Data</button>
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
              <button className="btn btn-ghost btn-sm">View All</button>
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
                  {RECENT_CALLS.map((call) => (
                    <tr key={call.id}>
                      <td>{call.village}</td>
                      <td className="phone-cell">{call.phone}</td>
                      <td>
                        <span className={`badge ${
                          call.status === 'Completed' ? 'badge-green' : 
                          call.status === 'In Progress' ? 'badge-blue' : 'badge-orange'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td>{call.time}</td>
                      <td>{call.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="dashboard-sidebar">
          <div className="card actions-card">
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

          <div className="card upgrade-card">
            <div className="upgrade-icon">
              <TrendingUp size={24} />
            </div>
            <h4>Village Registration</h4>
            <p>You have {stats.pendingRegistrations} pending registration requests. Review and activate them to scale impact.</p>
            <button className="btn btn-accent btn-sm w-full" style={{marginTop: '12px', width: '100%', justifyContent: 'center'}}>
              {stats.pendingRegistrations > 0 ? 'Review Requests' : 'All Caught Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
