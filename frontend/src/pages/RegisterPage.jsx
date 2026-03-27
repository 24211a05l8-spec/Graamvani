import { useState } from 'react';
import axios from 'axios';
import { UserPlus, Upload, CheckCircle2, ShieldCheck, MapPin, Phone, Users } from 'lucide-react';
import './RegisterPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState('panchayat'); // 'panchayat' or 'individual'
  const [formData, setFormData] = useState({
    panchayatName: '',
    district: '',
    state: '',
    pincode: '',
    village: '',
    contactPerson: '',
    contactPhone: '',
    farmerCount: '',
    name: '', // for individual
    phone: '' // for individual
  });

  const [villages, setVillages] = useState([]);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handlePincodeChange = async (e) => {
    const pin = e.target.value;
    setFormData(prev => ({ ...prev, pincode: pin }));

    if (pin.length === 6) {
      setLoadingPincode(true);
      try {
        const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
        const data = response.data[0];
        
        if (data && data.Status === "Success") {
          const postOffices = data.PostOffice;
          const first = postOffices[0];
          
          setFormData(prev => ({
            ...prev,
            state: first.State,
            district: first.District,
            pincode: pin
          }));
          
          setVillages(postOffices.map(po => po.Name));
          setError(null);
        } else {
          setError("Invalid PIN Code");
          setVillages([]);
        }
      } catch (err) {
        console.error("PIN lookup error:", err);
        setError("Could not fetch PIN details");
      } finally {
        setLoadingPincode(false);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        registrationType
      };
      await axios.post(`${API_BASE_URL}/register`, payload);
      setSubmitted(true);
      setError(null);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="register-success container">
        <div className="card success-card animate-fadein">
          <div className="success-icon">
            <CheckCircle2 size={64} color="var(--accent)" />
          </div>
          <h1>Registration Received!</h1>
          <p>
            {registrationType === 'panchayat' 
              ? `We've received the request for ${formData.panchayatName}.`
              : `Welcome to GraamVaani, ${formData.name}!`}
          </p>
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">{formData.village}, {formData.district}</span>
            </div>
            {registrationType === 'panchayat' && (
              <div className="detail-item">
                <span className="detail-label">Farmers</span>
                <span className="detail-value">{formData.farmerCount} to be registered</span>
              </div>
            )}
          </div>
          <p className="next-steps-text">
            {registrationType === 'panchayat' 
              ? `A GraamVaani representative will call ${formData.contactPhone} within 24 hours to verify Panchayat credentials.`
              : `You'll receive a welcome call at ${formData.phone} shortly with your first audio bulletin.`}
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page container" style={{ paddingTop: '180px' }}>
      <div className="register-grid">
        <div className="register-info">
          <span className="badge badge-orange">
            {registrationType === 'panchayat' ? 'For Local Leaders' : 'For Everyone'}
          </span>
          <h1 className="register-title">
            {registrationType === 'panchayat' ? (
              <>Register Your <span className="gradient-text">Village Cluster</span></>
            ) : (
              <>Join the <span className="gradient-text">Voice Revolution</span></>
            )}
          </h1>
          <p className="register-subtitle">
            {registrationType === 'panchayat' 
              ? 'Empower your community with on-demand voice news. One registration covers all farmers in your jurisdiction.'
              : 'Listen to hyper-local news and government alerts on any phone. No internet required.'}
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
            <div className="registration-type-toggle">
              <button 
                type="button" 
                className={`toggle-btn ${registrationType === 'panchayat' ? 'active' : ''}`}
                onClick={() => setRegistrationType('panchayat')}
              >
                Village Leader
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${registrationType === 'individual' ? 'active' : ''}`}
                onClick={() => setRegistrationType('individual')}
              >
                Individual Farmer
              </button>
            </div>

            <div className="form-header">
              <h3>{registrationType === 'panchayat' ? 'Panchayat Details' : 'Personal Details'}</h3>
              <p>Step {step} of 1</p>
            </div>

            {registrationType === 'panchayat' ? (
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
            ) : (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" name="name" className="form-input" 
                    placeholder="e.g. Rajesh Kumar" required 
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" name="phone" className="form-input" 
                    placeholder="10-digit mobile" required 
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input 
                  type="text" name="pincode" className="form-input" 
                  placeholder="6-digit PIN" required 
                  maxLength="6"
                  onChange={handlePincodeChange}
                  value={formData.pincode}
                />
                {loadingPincode && <span className="input-tip">Fetching location...</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Village / Post Office</label>
                {villages.length > 0 ? (
                  <select name="village" className="form-select" required onChange={handleChange} value={formData.village}>
                    <option value="">Select Village</option>
                    {villages.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" name="village" className="form-input" 
                    placeholder="Enter Village Name" required 
                    onChange={handleChange}
                    value={formData.village}
                  />
                )}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">District</label>
                <input 
                  type="text" name="district" className="form-input" 
                  placeholder="e.g. Muzaffarpur" required 
                  onChange={handleChange}
                  value={formData.district}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input 
                  type="text" name="state" className="form-input" 
                  placeholder="State" required 
                  onChange={handleChange}
                  value={formData.state}
                />
              </div>
            </div>

            {registrationType === 'panchayat' && (
              <>
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
              </>
            )}

            {error && <div className="error-message" style={{color: 'var(--red)', marginBottom: '15px'}}>{error}</div>}
            <button type="submit" className="btn btn-primary btn-lg w-full" style={{marginTop: '10px', width: '100%', justifyContent: 'center'}}>
              Submit {registrationType === 'panchayat' ? 'Panchayat' : 'Registration'}
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
