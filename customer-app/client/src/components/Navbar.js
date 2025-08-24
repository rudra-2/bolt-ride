import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const token = localStorage.getItem("token");
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      const isDarkNow = savedTheme === "dark" || document.documentElement.classList.contains("dark");
      setIsDark(isDarkNow);
    };
    updateTheme();
    window.addEventListener("storage", updateTheme);
    return () => window.removeEventListener("storage", updateTheme);
  }, []);

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    if (isCurrentlyDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <nav className="bg-gray-800/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-evgreen/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-evgreen to-green-300 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
            BoltRide
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-700/50 dark:bg-gray-600/50 hover:bg-evgreen/20 transition duration-300 group"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300 group-hover:text-evgreen" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium hover:scale-105"
                >
                  Dashboard
                </Link>
                <Link
                  to="/stations"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium hover:scale-105"
                >
                  Stations
                </Link>
                <Link
                  to="/rides"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium hover:scale-105"
                >
                  Rides
                </Link>
                <Link
                  to="/wallet"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium hover:scale-105"
                >
                  Wallet
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-full font-medium transition duration-300 hover:scale-105 shadow-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium hover:scale-105"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-evgreen to-green-400 hover:from-green-400 hover:to-evgreen text-black px-6 py-2 rounded-full font-medium transition duration-300 hover:scale-105 shadow-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-700/50 dark:bg-gray-600/50 hover:bg-evgreen/20 transition duration-300"
            >
              {isDark ? (
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-evgreen hover:text-green-300 transition duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-gray-700/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-evgreen/20 py-4 rounded-b-lg">
            {token ? (
              <div className="flex flex-col space-y-3">
                <Link
                  to="/dashboard"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium px-4 py-2 hover:bg-evgreen/10 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/stations"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium px-4 py-2 hover:bg-evgreen/10 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  Stations
                </Link>
                <Link
                  to="/rides"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium px-4 py-2 hover:bg-evgreen/10 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  Rides
                </Link>
                <Link
                  to="/wallet"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium px-4 py-2 hover:bg-evgreen/10 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  Wallet
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-red-400 hover:text-red-300 transition duration-300 font-medium px-4 py-2 text-left hover:bg-red-500/10 rounded-lg mx-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link
                  to="/login"
                  className="text-gray-200 dark:text-gray-300 hover:text-evgreen transition duration-300 font-medium px-4 py-2 hover:bg-evgreen/10 rounded-lg mx-2"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-evgreen to-green-400 text-black px-4 py-2 rounded-lg font-medium mx-2 text-center hover:scale-105 transition-transform"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
