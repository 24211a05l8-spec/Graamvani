import { Link } from 'react-router-dom';
import { Phone, MapPin, Radio, Mic, Globe2, Zap, Users, TrendingUp, Shield, ChevronRight, Volume2, Star, Heart, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import './LandingPage.css';

const HOTLINES = [
  { number: '04041895241', label: 'Local Village News', lang: 'Auto-detected', color: '#f97316' },
  { number: '04041895242', label: 'National News Today', lang: 'Hindi / English', color: '#10b981' },
  { number: '04041895243', label: 'Global Hot Topics (War/Policy)', lang: 'Multi-language', color: '#8b5cf6' },
];

const HOW_STEPS = [
  { icon: <Phone size={24} />, step: '01', title: 'Give a Missed Call', desc: 'Dial any GraamVaani number from ANY phone — from basic keypad to latest smartphone. No charge.' },
  { icon: <Volume2 size={24} />, step: '02', title: 'We Call You Back', desc: 'Within seconds, we call you back with a fresh audio bulletin — no data needed, free call.' },
  { icon: <Mic size={24} />, step: '03', title: 'Hear Your News', desc: 'News in your language, about your district. Government schemes, weather, local alerts.' },
  { icon: <MapPin size={24} />, step: '04', title: 'Auto-Personalized', desc: 'We detect your region from your registered number and serve hyper-local bulletins.' },
];

const STATS = [
  { value: '700M+', label: 'Potential Rural Listeners', icon: <Users size={22} /> },
  { value: '22+', label: 'Indian languages supported', icon: <Globe2 size={22} /> },
  { value: '₹0', label: 'Cost to the listener', icon: <Zap size={22} /> },
  { value: '6AM', label: 'Fresh bulletin every morning', icon: <Radio size={22} /> },
];

const TAGS = [
  { label: 'Voice-First Technology', icon: <Mic size={14} /> },
  { label: 'Zero Data Usage', icon: <Zap size={14} /> },
  { label: 'Hyperlocal Content', icon: <MapPin size={14} /> },
  { label: 'Multi-Language AI', icon: <Globe2 size={14} /> },
  { label: 'Community Infrastructure', icon: <Users size={14} /> },
  { label: 'Direct Impact', icon: <TrendingUp size={14} /> },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="status-dot online" />
            Live in 8 districts · 1.2L registered users
          </div>
          <h1 className="hero-title">
            The News Radio
            <br />
            <span className="gradient-text">In Your Pocket</span>
          </h1>
          <p className="hero-sub">
            No internet. No smartphone. No literacy required.
            <br />
            <strong>One missed call</strong> — hear today's news in your language, about your village.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Register Your Village <ChevronRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              How It Works
            </a>
          </div>

          {/* Phone display */}
          <div className="hero-phone-row">
            {HOTLINES.map((h) => (
              <div className="hotline-card" key={h.number} style={{ '--accent-color': h.color }}>
                <div className="hotline-icon">
                  <Phone size={18} />
                </div>
                <div className="hotline-info">
                  <span className="hotline-number">{h.number}</span>
                  <span className="hotline-label">{h.label}</span>
                  <span className="hotline-lang">{h.lang}</span>
                </div>
                <div className="hotline-wave">
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div className="stat-item" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-orange">Simple by Design</span>
            <h2 className="section-title">Zero friction. <span className="gradient-text">One missed call.</span></h2>
            <p className="section-desc">Works on any phone, on any network, anywhere in India.</p>
          </div>
          <div className="steps-grid">
            {HOW_STEPS.map((s) => (
              <div className="step-card" key={s.step}>
                <div className="step-number">{s.step}</div>
                <div className="step-icon">{s.icon}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== CUSTOM TAGS SECTION ===== */}
      <section className="section tags-section">
        <div className="container">
          <div className="tags-container">
            {TAGS.map((tag) => (
              <div key={tag.label} className="feature-tag">
                {tag.icon}
                <span>{tag.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-orb" />
            <h2 className="cta-title">
              Ready to bring
              <br />
              <span className="gradient-text">GraamVaani</span>
              <br />
              to your community?
            </h2>
            <p className="cta-sub">Start reaching your local village clusters today with reliable voice news.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Register Your Panchayat <ChevronRight size={18} />
              </Link>
              <Link to="/admin" className="btn btn-secondary btn-lg">
                View Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="brand-icon" style={{width:32,height:32}}>
              <Radio size={16} />
            </div>
            <span>GraamVaani · ग्रामवाणी</span>
          </div>
          <div className="footer-tags">
            <span className="badge badge-orange">#VoiceNews</span>
            <span className="badge badge-green">#Hyperlocal</span>
            <span className="badge badge-purple">#ZeroData</span>
          </div>
          <p className="footer-text">Built with <Heart size={12} color="#ef4444" fill="#ef4444" /> for Community Connection.</p>
          <p className="footer-text">© 2025 GraamVaani. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
