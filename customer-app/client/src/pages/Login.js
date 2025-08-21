import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    console.log('Starting login process with:', formData.email);

    try {
      const response = await authAPI.login(formData);

      console.log('Login response:', response);

      // Check if we got a token (successful login)
      if (response.data && response.data.token && response.data.customer) {
        console.log('Login successful! Token received');

        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.customer));

        console.log('Data stored in localStorage');
        console.log('Attempting to navigate to dashboard...');

        // Navigate to dashboard
        navigate('/dashboard');

      } else {
        console.error('Login response missing token or customer:', response);
        setError(response.data?.message || 'Login failed - invalid response format');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-evgreen mb-2 drop-shadow-lg">
            BoltRide ⚡
          </h1>
          <p className="text-evwhite/80">Welcome back to the future</p>
        </div>

        {/* Form Container */}
        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-evgreen/20">
          <h2 className="text-3xl font-bold text-evgreen mb-6 text-center bg-gradient-to-r from-evgreen to-green-300 bg-clip-text text-transparent">
            Sign In
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl text-evwhite placeholder-gray-400 focus:border-evgreen focus:ring-2 focus:ring-evgreen/20 focus:outline-none transition duration-300"
                disabled={loading}
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-evgreen/0 via-evgreen/5 to-evgreen/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl text-evwhite placeholder-gray-400 focus:border-evgreen focus:ring-2 focus:ring-evgreen/20 focus:outline-none transition duration-300"
                disabled={loading}
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-evgreen/0 via-evgreen/5 to-evgreen/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-evgreen to-green-400 hover:from-green-400 hover:to-evgreen text-black font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-evgreen hover:text-green-300 font-semibold transition duration-300"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <h4 className="text-evgreen font-semibold mb-2 text-sm">Demo Credentials</h4>
            <p className="text-gray-400 text-xs mb-1">Email: joh@example.com</p>
            <p className="text-gray-400 text-xs">Password: password123</p>
            <p className="text-gray-500 text-xs mt-2">*Create account if these don't work</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-500 hover:text-evgreen transition duration-300 text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;