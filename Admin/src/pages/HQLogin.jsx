import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './HQLogin.css';

export default function HQLogin() {
  const [email, setEmail] = useState('admin@aegis.lk');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement Firebase Auth
    // For now, store email in localStorage and navigate to dashboard
    localStorage.setItem('hq_user_email', email);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/hq/dashboard');
    }, 500);
  };

  return (
    <div className="hq-login-container">
      <div className="hq-login-header">
        <div className="logo-wrapper">
          <Logo size="large" showText={false} />
        </div>
      </div>

      <div className="hq-login-form-container">
        <form className="hq-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aegis.lk"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Accessing...' : 'Access Command Center'}
          </button>
        </form>

        <p className="footer-disclaimer">
          Authorized personnel only. All access is monitored and logged.
        </p>
      </div>
    </div>
  );
}

