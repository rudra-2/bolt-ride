import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && true);
  });

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const response = await API.get("/wallet/balance");
      setBalance(response.data.wallet_balance);
    } catch (err) {
      setError("Failed to fetch wallet balance");
      console.error("Wallet fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) < 10) {
      setError("Minimum top-up amount is ₹10");
      return;
    }

    if (parseFloat(amount) > 10000) {
      setError("Maximum top-up amount is ₹10,000");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await API.post("/wallet/add", { 
        amount: parseFloat(amount) 
      });
      
      setBalance(response.data.wallet_balance);
      setAmount("");
      
      // Show success message
      alert(`₹${amount} added successfully! New balance: ₹${response.data.wallet_balance}`);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add money");
      console.error("Add money error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const themeClasses = darkMode
    ? "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white"
    : "min-h-screen bg-gradient-to-br from-white via-gray-50 to-evgreen/5 text-gray-800";

  const cardClasses = darkMode
    ? "bg-gray-800/80 backdrop-blur-sm border border-gray-700/50"
    : "bg-white/80 backdrop-blur-sm border border-evgreen/10 shadow-lg";

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-evgreen/20 border-t-evgreen mx-auto mb-6"></div>
          <div className="text-2xl font-bold text-evgreen">Loading Wallet</div>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-evgreen rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="text-evgreen">Wallet</span>
            </h1>
            <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Manage your ride credits and top up your balance
            </p>
          </div>
          <Link
            to="/dashboard"
            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all duration-300"
          >
            Dashboard
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Current Balance Card */}
        <div className={`${cardClasses} rounded-2xl p-8 mb-8 text-center`}>
          <div className="mb-6">
            {/* Premium Wallet SVG Icon */}
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" fill="#2563eb" />
                <text x="32" y="40" text-anchor="middle" font-size="32" fill="#fff" font-family="Arial, Helvetica, sans-serif">₹</text>
              </svg>
            </div>
            <h2 className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"} mb-2`}>
              Current Balance
            </h2>
            <div className="text-6xl font-black text-evgreen mb-4">
              ₹{balance.toFixed(2)}
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Available for rides and passes
            </p>
          </div>
          
          {balance < 50 && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
              <div className="flex items-center justify-center">
                <span className="text-yellow-300 text-sm font-medium">
                  Low balance! Add money to continue riding.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Add Money Section */}
        <div className={`${cardClasses} rounded-2xl p-8`}>
          <h3 className="text-2xl font-bold mb-6">Add Money</h3>
          
          {/* Quick Amount Buttons */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"} mb-3`}>
              Quick Amounts
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`p-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                    amount === quickAmount.toString()
                      ? 'bg-evgreen text-black'
                      : 'bg-evgreen/20 text-evgreen hover:bg-evgreen/30'
                  }`}
                >
                  ₹{quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"} mb-3`}>
              Custom Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-evgreen">₹</span>
              <input
                type="number"
                min="10"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (₹10 - ₹10,000)"
                className={`w-full pl-12 pr-4 py-4 rounded-xl text-xl font-bold border-2 transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-evgreen'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-evgreen'
                } focus:ring-2 focus:ring-evgreen/20 focus:outline-none`}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Minimum: ₹10
              </span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Maximum: ₹10,000
              </span>
            </div>
          </div>

          {/* Add Money Button */}
          <button
            onClick={addMoney}
            disabled={!amount || parseFloat(amount) < 10 || parseFloat(amount) > 10000 || processing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              !amount || parseFloat(amount) < 10 || parseFloat(amount) > 10000 || processing
                ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-evgreen to-green-400 text-black hover:scale-105 shadow-lg hover:shadow-evgreen/25'
            }`}
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-2"></div>
                Processing...
              </div>
            ) : (
              `Add ${amount ? `₹${amount}` : 'Money'}`
            )}
          </button>

          {/* Payment Info */}
          <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Payment Information
            </h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Secure payment processing</li>
              <li>• Instant credit to your wallet</li>
              <li>• All major payment methods accepted</li>
              <li>• 24/7 customer support available</li>
            </ul>
          </div>
        </div>

        {/* Wallet Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Ride Credits SVG */}
            <div className={`${cardClasses} rounded-xl p-6 text-center`}>
              <div className="mb-3 flex justify-center">
                <svg className="w-10 h-10 text-evgreen" fill="none" viewBox="0 0 32 32" stroke="currentColor">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1" />
                  <path d="M10 22l6-12 6 12" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-2">Ride Credits</h4>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Use your balance for eco-friendly bike rides across Ahmedabad
              </p>
            </div>

            {/* Passes SVG */}
            <div className={`${cardClasses} rounded-xl p-6 text-center`}>
              <div className="mb-3 flex justify-center">
                <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 32 32" stroke="currentColor">
                  <rect x="6" y="10" width="20" height="12" rx="4" fill="currentColor" opacity="0.1" />
                  <rect x="6" y="10" width="20" height="12" rx="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 16h12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-2">Passes</h4>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Buy weekly or monthly passes for unlimited rides
              </p>
            </div>

            {/* Secure SVG */}
            <div className={`${cardClasses} rounded-xl p-6 text-center`}>
              <div className="mb-3 flex justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 32 32" stroke="currentColor">
                  <rect x="10" y="14" width="12" height="8" rx="4" fill="currentColor" opacity="0.1" />
                  <rect x="10" y="14" width="12" height="8" rx="4" stroke="currentColor" strokeWidth="2" />
                  <circle cx="16" cy="18" r="2" fill="currentColor" />
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-2">Secure</h4>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Your money is safe with encrypted transactions
              </p>
            </div>
          </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            to="/buy-passes"
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105"
          >
            Buy Ride Passes
          </Link>
          <Link
            to="/rides"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105"
          >
            Ride History
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 bg-evgreen hover:bg-green-600 text-black px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105"
          >
            Find Bikes
          </Link>
        </div>
      </div>
    </div>
  );
}
