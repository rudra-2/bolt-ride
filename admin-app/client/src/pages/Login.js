import React, { useState } from "react";
import { loginStationManager } from "../api/vehicles";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError(""); // reset error
    setLoading(true);
    
    try {
      const res = await loginStationManager(email, password);

      if (res.status === "success") {
        // Store manager info in localStorage
        localStorage.setItem('manager', JSON.stringify(res.manager));
        navigate(`/dashboard/${res.manager.station_id}`);
      } else {
        setError(res.message);
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleSupportClick = (e) => {
    e.preventDefault();
    // Add your support contact logic here
    alert("Please contact support at support@boltride.com or call +91-1234567890");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ width: "500px" }}>
        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="fw-bold text-success">
            <i className="bi bi-building me-2"></i> Station Manager
          </h3>
          <p className="text-muted">Access your station dashboard</p>
        </div>

        {/* Form */}
        <h5 className="fw-bold mb-3">Admin Login</h5>
        <p className="text-muted" style={{ fontSize: "14px" }}>
          Enter your email and password to access the management dashboard
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-envelope"></i>
            </span>
            <input
              type="email"
              className="form-control"
              placeholder="manager@station.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-lock"></i>
            </span>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        <button
          className="btn btn-success w-100 fw-bold"
          onClick={handleLogin}
          disabled={loading}
        >
          <i className="bi bi-box-arrow-in-right me-2"></i> 
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <p className="text-center mt-3 mb-0 text-muted" style={{ fontSize: "14px" }}>
          Need help accessing your account?{" "}
          <button 
            onClick={handleSupportClick}
            className="btn btn-link text-success fw-bold text-decoration-none p-0"
            style={{ border: 'none', background: 'none' }}
          >
            Contact Support
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
