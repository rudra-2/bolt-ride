import React, { useState } from "react";
import { loginStation } from "../api/vehicles";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [stationId, setStationId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(""); // reset error
    const res = await loginStation(stationId, password);

    if (res.status === "success") {
      navigate(`/dashboard/${stationId}`);
    } else {
      setError(res.message);
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
          Enter your station credentials to access the management dashboard
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Station ID</label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-credit-card-2-front"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="STN001"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
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
            />
          </div>
        </div>

        <button
          className="btn btn-success w-100 fw-bold"
          onClick={handleLogin}
        >
          <i className="bi bi-box-arrow-in-right me-2"></i> Sign In
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
