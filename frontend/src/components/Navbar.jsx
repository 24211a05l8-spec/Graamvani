import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, Menu, X, Phone } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/register', label: 'Register Village' },
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/bulletins', label: 'Bulletins' },
    { to: '/admin/analytics', label: 'Analytics' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Radio size={18} />
          </div>
          <span className="brand-name">GraamVaani</span>
          <span className="brand-tag">ग्रामवाणी</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <a href="tel:04041895241" className="btn btn-primary btn-sm">
            <Phone size={14} />
            Demo Call
          </a>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}
