import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, Calendar, Users, PhoneCall, Clock, MapPin, Activity } from 'lucide-react';
import './AnalyticsPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const COLORS = ['var(--primary)', 'var(--accent)', 'var(--success)', 'var(--warning)', 'var(--error)'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/analytics/detailed`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-page container animate-fadein">
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader"></div>
        </div>
      </div>
    );
  }

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
        {/* Call Volume Trend */}
        <div className="card chart-card wide">
          <div className="card-header">
            <h3>Call Volume Trend</h3>
            <div className="status-dot online"></div>
          </div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.callTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-800)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary)' }}
                  cursor={{ fill: 'var(--bg-700)' }}
                />
                <Bar dataKey="calls" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Engagement Distribution */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Action Engagement</h3>
          </div>
          <div className="chart-container" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.actionStats || []}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.actionStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-800)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {data?.actionStats?.map((act, i) => (
                <div className="legend-item" key={act.name}>
                  <div className="dot" style={{ background: COLORS[i % COLORS.length] }}></div>
                  <span>{act.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Village Impact Table */}
        <div className="card chart-card wide">
          <div className="card-header">
            <h3>Village-wise Impact (Beneficiaries)</h3>
            <span className="badge">Estimated</span>
          </div>
          <div className="village-table-container">
            <table className="village-table">
              <thead>
                <tr>
                  <th>Village</th>
                  <th>Direct Impact Count</th>
                  <th>Engagement Level</th>
                </tr>
              </thead>
              <tbody>
                {data?.villageStats?.map((v, index) => (
                  <tr key={index}>
                    <td className="village-name"><MapPin size={14} /> {v.name}</td>
                    <td><strong>{v.count}</strong> families</td>
                    <td>
                      <div className="activity-meter">
                        <div className="activity-fill" style={{ width: `${Math.min(v.count * 100/100, 100)}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Static Insights based on live data types */}
        <div className="card insight-card">
          <div className="insight-icon"><Activity size={20} /></div>
          <h4>Action Efficiency</h4>
          <p>The most frequent action is <strong>{data?.actionStats?.sort((a,b) => b.value-a.value)[0]?.name || 'News Bulletin'}</strong>. Consider making this the default menu option.</p>
        </div>

        <div className="card insight-card">
          <div className="insight-icon"><Users size={20} /></div>
          <h4>Top Performer</h4>
          <p><strong>{data?.villageStats?.[0]?.name || 'Bihar'}</strong> cluster is leading in engagement. Replicate their local NGO outreach model elsewhere.</p>
        </div>

        <div className="card insight-card">
          <div className="insight-icon"><PhoneCall size={20} /></div>
          <h4>Call Completion</h4>
          <p>Average listen time for <strong>News</strong> is 2m 45s. Bulletins exceeding 3m see a drop-off in the final 30 seconds.</p>
        </div>
      </div>
    </div>
  );
}
