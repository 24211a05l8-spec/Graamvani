import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import BulletinsPage from './pages/BulletinsPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<><Navbar /><RegisterPage /></>} />
        <Route path="/admin" element={<><Navbar /><AdminDashboard /></>} />
        <Route path="/admin/analytics" element={<><Navbar /><AnalyticsPage /></>} />
        <Route path="/admin/bulletins" element={<><Navbar /><BulletinsPage /></>} />
      </Routes>
    </>
  );
}

export default App;
