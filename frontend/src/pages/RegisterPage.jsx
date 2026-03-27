import { useState } from 'react';
import { UserPlus, Upload, CheckCircle2, ShieldCheck, MapPin, Phone, Users } from 'lucide-react';
import './RegisterPage.css';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    panchayatName: '',
    district: '',
    state: '',
    contactPerson: '',
    contactPhone: '',
    farmerCount: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, this would hit /api/register
  };

  if (submitted) {
    return (
      <div className="register-success container">
        <div className="card success-card animate-fadein">
          <div className="success-icon">
            <CheckCircle2 size={64} color="var(--accent)" />
          </div>
          <h1>Registration Received!</h1>
          <p>We've received the request for <strong>{formData.panchayatName}</strong>.</p>
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">District</span>
              <span className="detail-value">{formData.district}, {formData.state}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Farmers</span>
              <span className="detail-value">{formData.farmerCount} to be registered</span>
            </div>
          </div>
          <p className="next-steps-text">
            A GraamVaani representative will call <strong>{formData.contactPhone}</strong> within 24 hours to verify the Panchayat credentials and set up the voice gateway.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page container">
      <div className="register-grid">
        <div className="register-info">
          <span className="badge badge-orange">For Local Leaders</span>
          <h1 className="register-title">Register Your <span className="gradient-text">Village Cluster</span></h1>
          <p className="register-subtitle">
            Empower your community with on-demand voice news. One registration covers all farmers in your jurisdiction.
          </p>

          <div className="perks-list">
            <div className="perk-item">
              <div className="perk-icon"><ShieldCheck size={20} /></div>
              <div>
                <h4>Verified Voice Updates</h4>
                <p>Official government news delivered directly to your farmers.</p>
              </div>
            </div>
            <div className="perk-item">
              <div className="perk-icon"><MapPin size={20} /></div>
              <div>
                <h4>Hyperlocal Alerts</h4>
                <p>Weather alerts specifically for your district's crop patterns.</p>
              </div>
            </div>
            <div className="perk-item">
              <div className="perk-icon"><Users size={20} /></div>
              <div>
                <h4>Zero Data Usage</h4>
                <p>Farmers only need a basic phone. No internet required.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="register-form-wrap">
          <form className="card register-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h3>Panchayat Details</h3>
              <p>Step {step} of 1</p>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Panchayat Name</label>
                <input 
                  type="text" name="panchayatName" className="form-input" 
                  placeholder="e.g. Rampur Gram Panchayat" required 
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Farmers</label>
                <input 
                  type="number" name="farmerCount" className="form-input" 
                  placeholder="e.g. 450" required 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">District</label>
                <input 
                  type="text" name="district" className="form-input" 
                  placeholder="e.g. Muzaffarpur" required 
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select name="state" className="form-select" required onChange={handleChange}>
                  <option value="">Select State</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                </select>
              </div>
            </div>

            <div className="divider" style={{margin: '10px 0'}} />

            <div className="form-header">
              <h3>Primary Contact</h3>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Sarpanch / Secretary Name</label>
                <input 
                  type="text" name="contactPerson" className="form-input" 
                  placeholder="Full Name" required 
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input 
                  type="tel" name="contactPhone" className="form-input" 
                  placeholder="10-digit mobile" required 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="bulk-upload-note">
              <div className="icon"><Upload size={16} /></div>
              <p>After verification, you can bulk-upload farmer phone numbers via Excel/CSV in the dashboard.</p>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" style={{marginTop: '10px', width: '100%', justifyContent: 'center'}}>
              Submit Registration
            </button>
            <p className="form-footer-tip">
              By submitting, you agree to our terms for community broadcasting.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
