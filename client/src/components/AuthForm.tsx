import React, { useState } from 'react';
import './AuthForm.css';
import { API_BASE_URL } from '../config';

interface AuthFormProps {
  type: 'login' | 'register';
  onSuccess: (token: string, user: any) => void;
  onSwitch: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSuccess, onSwitch }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (type === 'register' && password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    const endpoint = type === 'login' ? '/api/login' : '/api/register';
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (type === 'login') {
        onSuccess(data.token, data.user);
      } else {
        setSuccessMsg('Registration successful! Please login.');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        // Wait a bit then switch to login
        setTimeout(() => {
          onSwitch();
          setSuccessMsg('');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-form pixel-border">
      <h2>{type === 'login' ? 'LOGIN' : 'REGISTER'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>USERNAME</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div className="input-group">
          <label>PASSWORD</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        {type === 'register' && (
          <div className="input-group">
            <label>CONFIRM PASSWORD</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
        )}
        {error && <p className="error-msg">{error}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}
        <button type="submit" className="submit-btn">
          {type === 'login' ? 'GO!' : 'JOIN'}
        </button>
      </form>
      <p className="switch-text" onClick={onSwitch}>
        {type === 'login' ? 'NEED AN ACCOUNT? SIGN UP' : 'ALREADY HAVE AN ACCOUNT? LOGIN'}
      </p>
    </div>
  );
};

export default AuthForm;
