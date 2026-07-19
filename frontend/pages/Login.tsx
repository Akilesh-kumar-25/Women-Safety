import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeClosed = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error('Password or email is wrong, try again');
      }

      localStorage.setItem('userUid', data.uid);
      localStorage.setItem('userName', data.name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="glass-panel auth-box">
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <h1 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>Women's Safety App</h1>
            <h2>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Login to access your dashboard.</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <div className="eye-icon" onClick={() => setShowPassword(!showPassword)} title="Toggle password visibility">
                {showPassword ? <EyeOpen /> : <EyeClosed />}
              </div>
              {error && <span className="error-message">{error}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop: '1rem'}}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            Don't have an account? <Link to="/signup" className="btn-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
