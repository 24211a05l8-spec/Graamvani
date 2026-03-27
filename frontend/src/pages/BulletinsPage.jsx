import { useState } from 'react';
import { Plus, Radio, Clock, Languages, Globe, Play, FileAudio, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import './BulletinsPage.css';

const MOCK_BULLETINS = [
  { id: 1, title: 'Morning News Bulletin - Bihar', date: 'Oct 24, 2025', lang: 'Hindi / Bhojpuri', plays: '1,240', status: 'Active' },
  { id: 2, title: 'Agricultural Weather Update', date: 'Oct 24, 2025', lang: 'Hindi', plays: '842', status: 'Active' },
  { id: 3, title: 'State Welfare Schemes (PM-KISAN)', date: 'Oct 23, 2025', lang: 'All Regional', plays: '4,560', status: 'Archived' },
  { id: 4, title: 'Groundwater Level Advisory', date: 'Oct 22, 2025', lang: 'Telugu', plays: '930', status: 'Archived' },
];

export default function BulletinsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bulletins-page container">
      <header className="page-header animate-fadein">
        <div>
          <h1 className="page-title">Bulletins Management</h1>
          <p className="page-sub">Create and deploy audio news updates for your village clusters.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Create New Bulletin
        </button>
      </header>

      <div className="bulletins-grid animate-fadein">
        <div className="card active-summary">
          <div className="summary-item">
            <Radio size={24} color="var(--primary)" />
            <div>
              <span className="summary-val">8</span>
              <span className="summary-label">Active News Channels</span>
            </div>
          </div>
          <div className="summary-item">
            <Globe size={24} color="var(--accent)" />
            <div>
              <span className="summary-val">22</span>
              <span className="summary-label">Language Models Loaded</span>
            </div>
          </div>
          <div className="summary-item">
            <Clock size={24} color="var(--purple)" />
            <div>
              <span className="summary-val">06:00 AM</span>
              <span className="summary-label">Next Auto-Generation</span>
            </div>
          </div>
        </div>

        <div className="card bulletins-list-card">
          <div className="card-header">
            <h3>Recent Bulletins</h3>
            <div className="filters">
              <select className="form-select btn-sm">
                <option>All Languages</option>
                <option>Hindi</option>
                <option>Bhojpuri</option>
              </select>
            </div>
          </div>
          
          <div className="bulletins-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Bulletin Name</th>
                  <th>Published</th>
                  <th>Language</th>
                  <th>Total Plays</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_BULLETINS.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="bulletin-name">
                        <FileAudio size={16} color="var(--text-muted)" />
                        {b.title}
                      </div>
                    </td>
                    <td>{b.date}</td>
                    <td><span className="badge badge-purple">{b.lang}</span></td>
                    <td>{b.plays}</td>
                    <td>
                      <span className={`badge ${b.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn" title="Play Demo"><Play size={14} /></button>
                      <button className="icon-btn" title="Edit Content"><Edit2 size={14} /></button>
                      <button className="icon-btn delete" title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="card modal-content animate-fadein">
            <h3>Create New Bulletin</h3>
            <p className="modal-sub">Input the news text or seed URL. AI will generate the natural voice bulletin.</p>
            
            <div className="form-group" style={{marginTop: '20px'}}>
              <label className="form-label">Title</label>
              <input type="text" className="form-input" placeholder="e.g. Weekly Market Rates" />
            </div>

            <div className="form-group" style={{marginTop: '15px'}}>
              <label className="form-label">News Seed (Text or URL)</label>
              <textarea className="form-input" rows="4" placeholder="Paste local news content here or an RSS feed URL..."></textarea>
            </div>

            <div className="grid-2" style={{marginTop: '15px'}}>
              <div className="form-group">
                <label className="form-label">Target Language</label>
                <select className="form-select">
                  <option>Hindi (Standard)</option>
                  <option>Bhojpuri</option>
                  <option>Maithili</option>
                  <option>Telugu</option>
                  <option>Kannada</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Voice Tone</label>
                <select className="form-select">
                  <option>Professional Radio</option>
                  <option>Folk Storyteller</option>
                  <option>Friendly Neighbor</option>
                </select>
              </div>
            </div>

            <div className="modal-actions" style={{marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary">Generate Audio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
