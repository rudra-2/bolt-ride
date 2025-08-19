import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api";

export default function Signup() {
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    mobile: "",
    password: "",
    license_number: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear errors when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (!form.customer_name.trim()) {
      setError("Customer name is required");
      setLoading(false);
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    if (!form.mobile.trim()) {
      setError("Mobile number is required");
      setLoading(false);
      return;
    }
    if (!form.password.trim() || form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (!form.license_number.trim()) {
      setError("License number is required");
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register(form);
      setSuccess("Account created successfully! Redirecting to login...");

      // Store token if provided
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { key: "customer_name", placeholder: "Full Name", type: "text" },
    { key: "email", placeholder: "Email Address", type: "email" },
    { key: "mobile", placeholder: "Mobile Number", type: "tel" },
    { key: "password", placeholder: "Password (min 6 chars)", type: "password" },
    { key: "license_number", placeholder: "License Number", type: "text" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-evgreen mb-2 drop-shadow-lg">
            BoltRide ⚡
          </h1>
          <p className="text-evwhite/80">Join the electric revolution</p>
        </div>

        {/* Form Container */}
        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-evgreen/20">
          <h2 className="text-3xl font-bold text-evgreen mb-6 text-center bg-gradient-to-r from-evgreen to-green-300 bg-clip-text text-transparent">
            Create Account
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">⚠️ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-evgreen/20 border border-evgreen/50 rounded-lg p-3 mb-4">
              <p className="text-evgreen text-sm">✅ {success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {inputFields.map((field) => (
              <div key={field.key} className="relative">
                <input
                  type={field.type}
                  name={field.key}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={handleChange}
                  className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl text-evwhite placeholder-gray-400 focus:border-evgreen focus:ring-2 focus:ring-evgreen/20 focus:outline-none transition duration-300"
                  disabled={loading}
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-evgreen/0 via-evgreen/5 to-evgreen/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-evgreen to-green-400 hover:from-green-400 hover:to-evgreen text-black font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-evgreen hover:text-green-300 font-semibold transition duration-300"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-evgreen font-semibold mb-3 text-center">Why BoltRide?</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <span className="text-evgreen mr-2">🌱</span>
                Eco-friendly transportation
              </div>
              <div className="flex items-center text-gray-300">
                <span className="text-evgreen mr-2">💳</span>
                Digital wallet & easy payments
              </div>
              <div className="flex items-center text-gray-300">
                <span className="text-evgreen mr-2">📍</span>
                Stations across the city
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            By signing up, you agree to our{" "}
            <a href="#" className="text-evgreen hover:text-green-300 transition duration-300">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-evgreen hover:text-green-300 transition duration-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
