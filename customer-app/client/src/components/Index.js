import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Index.css';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="index-container">
      <div className="index-content">
        <div className="hero-section">
          <div className="logo-section">
            <h1 className="app-title">⚡ Bolt Ride</h1>
            <p className="app-subtitle">Electric Vehicle Sharing Made Simple</p>
          </div>
          
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">🚗</span>
              <span>Find nearby electric vehicles</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📍</span>
              <span>Locate charging stations</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💳</span>
              <span>Easy wallet management</span>
            </div>
          </div>
        </div>

        <div className="auth-section">
          <h2>Get Started</h2>
          <div className="auth-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/register')}
            >
              Create Account
            </button>
          </div>
          
          <div className="demo-info">
            <p>New to Bolt Ride? <span className="highlight">Create an account</span> to start your electric journey!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
