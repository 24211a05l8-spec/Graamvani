import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, Filter, Users, PhoneCall, Clock } from 'lucide-react';
import './AnalyticsPage.css';

const CALL_DATA = [
  { day: 'Mon', calls: 450 },
  { day: 'Tue', calls: 520 },
  { day: 'Wed', calls: 480 },
  { day: 'Thu', calls: 610 },
  { day: 'Fri', calls: 590 },
  { day: 'Sat', calls: 750 },
  { day: 'Sun', calls: 840 },
];

const LANGUAGE_DATA = [
  { name: 'Hindi', value: 45 },
  { name: 'Telugu', value: 20 },
  { name: 'Bhojpuri', value: 15 },
  { name: 'Kannada', value: 10 },
  { name: 'Others', value: 10 },
];

export default function AnalyticsPage() {
  return (
    <div className="analytics-page container">
      <header className="page-header animate-fadein">
        <div>
          <h1 className="page-title">Impact Analytics</h1>
          <p className="page-sub">Monitor reach and engagement across all rural clusters.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm"><Calendar size={14} /> Last 7 Days</button>
          <button className="btn btn-primary btn-sm"><Download size={14} /> Export</button>
        </div>
      </header>

      <div className="analytics-grid animate-fadein">
        <div className="card chart-card wide">
          <div className="card-header">
            <h3>Call Volume Trend</h3>
            <div className="status-dot online"></div>
          </div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CALL_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-800)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Bar dataKey="calls" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header">
            <h3>Language Distribution (%)</h3>
          </div>
          <div className="language-list">
            {LANGUAGE_DATA.map((lang) => (
              <div className="lang-item" key={lang.name}>
                <div className="lang-info">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-val">{lang.value}%</span>
                </div>
                <div className="lang-bar-bg">
                  <div className="lang-bar-fill" style={{ width: `${lang.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card insight-card">
          <div className="insight-icon"><Clock size={20} /></div>
          <h4>Peak Engagement</h4>
          <p>Most farmers call between <strong>06:30 AM and 08:30 AM</strong> before heading to fields. Consider scheduling fresh bulletins by 06:00 AM.</p>
        </div>

        <div className="card insight-card">
          <div className="insight-icon"><Users size={20} /></div>
          <h4>New Cluster Growth</h4>
          <p>Registration in <strong>Bihar</strong> district has increased by <strong>24%</strong> this week after the last NGO workshop.</p>
        </div>

        <div className="card insight-card">
          <div className="insight-icon"><PhoneCall size={20} /></div>
          <h4>Call Completion</h4>
          <p>Average listen time is <strong>2m 45s</strong>. Bulletins exceeding 3m see a 30% drop-off in engagement.</p>
        </div>
      </div>
    </div>
  );
}
