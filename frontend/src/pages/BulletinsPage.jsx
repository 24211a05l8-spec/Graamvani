import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Radio, Clock, Languages, Globe, Play, FileAudio, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import './BulletinsPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export default function BulletinsPage() {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newBulletin, setNewBulletin] = useState({
    title: '',
    textSeed: '',
    language: 'Hindi (Standard)',
    voiceTone: 'Professional Radio'
  });

  useEffect(() => {
    fetchBulletins();
  }, []);

  const fetchBulletins = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/bulletins`);
      setBulletins(res.data);
    } catch (err) {
      console.error('Error fetching bulletins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post(`${API_BASE_URL}/bulletins`, newBulletin);
      setShowModal(false);
      fetchBulletins();
    } catch (err) {
      console.error('Error creating bulletin:', err);
    }
  };

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
                <option>Telugu</option>
                <option>Kannada</option>
              </select>
            </div>
          </div>
          
          <div className="bulletins-table-wrap">
            {loading ? (
              <div className="loading-state">Loading bulletins...</div>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Bulletin Name</th>
                    <th>Published</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletins.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="bulletin-name">
                          <FileAudio size={16} color="var(--text-muted)" />
                          {b.title}
                        </div>
                      </td>
                      <td>{new Date(b.createdAt?._seconds * 1000 || b.createdAt).toLocaleDateString()}</td>
                      <td><span className="badge badge-purple">{b.language}</span></td>
                      <td>
                        <span className={`badge ${b.isActive !== false ? 'badge-green' : 'badge-orange'}`}>
                          {b.isActive !== false ? 'Active' : 'Draft'}
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
            )}
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
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Weekly Market Rates" 
                value={newBulletin.title}
                onChange={(e) => setNewBulletin({...newBulletin, title: e.target.value})}
              />
            </div>

            <div className="form-group" style={{marginTop: '15px'}}>
              <label className="form-label">News Seed (Text or URL)</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="Paste local news content here or an RSS feed URL..."
                value={newBulletin.textSeed}
                onChange={(e) => setNewBulletin({...newBulletin, textSeed: e.target.value})}
              ></textarea>
            </div>

            <div className="grid-2" style={{marginTop: '15px'}}>
              <div className="form-group">
                <label className="form-label">Target Language</label>
                <select 
                  className="form-select"
                  value={newBulletin.language}
                  onChange={(e) => setNewBulletin({...newBulletin, language: e.target.value})}
                >
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Kannada">Kannada</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Voice Tone</label>
                <select 
                  className="form-select"
                  value={newBulletin.voiceTone}
                  onChange={(e) => setNewBulletin({...newBulletin, voiceTone: e.target.value})}
                >
                  <option>Professional Radio</option>
                  <option>Folk Storyteller</option>
                  <option>Friendly Neighbor</option>
                </select>
              </div>
            </div>

            <div className="modal-actions" style={{marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Generate Audio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
