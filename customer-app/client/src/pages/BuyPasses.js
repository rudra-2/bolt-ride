import React, { useState, useEffect } from 'react';

const BuyPasses = () => {
    const [selectedPass, setSelectedPass] = useState(null);
    const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && true);
    });

    useEffect(() => {
        fetchWalletBalance();
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    const fetchWalletBalance = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/wallet/balance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWalletBalance(data.wallet_balance || 0);
            }
        } catch (err) {
            console.error('Error fetching wallet balance:', err);
        }
    };

    const passes = [
        {
            id: 'daily',
            name: 'Daily Pass',
            price: 99,
            duration: '24 hours',
            rides: 'Unlimited',
            description: 'Perfect for a day of exploring',
            color: 'from-blue-500 to-blue-600',
            savings: '60% savings on regular fares',
            features: ['Unlimited 30-min rides', 'All station access', '24/7 support']
        },
        {
            id: 'weekly',
            name: 'Weekly Pass',
            price: 299,
            duration: '7 days',
            rides: 'Unlimited',
            description: 'Great for regular commuters',
            color: 'from-purple-500 to-purple-600',
            savings: '70% savings on regular fares',
            features: ['Unlimited 45-min rides', 'Priority bike access', 'Extended ride time'],
            popular: true
        },
        {
            id: 'monthly',
            name: 'Monthly Pass',
            price: 899,
            duration: '30 days',
            rides: 'Unlimited',
            description: 'Best value for daily riders',
            color: 'from-evgreen to-green-500',
            savings: '80% savings on regular fares',
            features: ['Unlimited 60-min rides', 'Premium bike access', 'Free ride extensions', 'Priority support']
        },
        {
            id: 'student',
            name: 'Student Pass',
            price: 199,
            duration: '30 days',
            rides: 'Unlimited',
            description: 'Special discount for students',
            color: 'from-orange-500 to-red-500',
            savings: '85% savings with student ID',
            features: ['Unlimited 45-min rides', 'Student verification required', 'Campus area priority']
        }
    ];

    const handleBuyPass = async (pass) => {
        if (walletBalance < pass.price) {
            alert(`Insufficient balance! You need ₹${pass.price - walletBalance} more.`);
            return;
        }

        setLoading(true);
        try {
            // Call backend API to purchase pass
            const response = await fetch('http://localhost:5000/api/passes/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    passType: pass.id,
                    passName: pass.name,
                    price: pass.price,
                    duration: pass.duration
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`🎉 ${pass.name} purchased successfully! Valid for ${pass.duration}.`);

                // Update wallet balance from server response
                setWalletBalance(result.newBalance || (walletBalance - pass.price));
            } else {
                const error = await response.json();
                alert(`❌ Purchase failed: ${error.message}`);
            }

        } catch (error) {
            console.error('Purchase error:', error);
            alert('❌ Purchase failed. Please check your connection and try again.');
        } finally {
            setLoading(false);
            setSelectedPass(null);
        }
    };

    const themeClasses = {
        bg: isDarkMode ? 'from-black via-gray-900 to-black' : 'from-gray-50 via-white to-gray-100',
        card: isDarkMode ? 'from-gray-800/50 to-gray-900/50 border-evgreen/20' : 'from-white/80 to-gray-50/80 border-evgreen/30',
        text: isDarkMode ? 'text-white' : 'text-gray-900',
        textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        button: isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-white/50 hover:bg-gray-100/50'
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${themeClasses.bg} p-6`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-evgreen to-green-300 bg-clip-text text-transparent mb-2">
                            Ride Passes
                        </h1>
                        <p className={themeClasses.textSecondary}>Choose the perfect pass for your riding needs</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Wallet Balance */}
                        <div className={`${themeClasses.card} bg-gradient-to-r backdrop-blur-sm rounded-xl p-4 border`}>
                            <div className="flex items-center">
                                <span className="text-evgreen text-2xl mr-2"></span>
                                                                <span className="mr-2">
                                                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                                                        <circle cx="12" cy="12" r="10" fill="#2563eb" />
                                                                        <text x="12" y="16" text-anchor="middle" font-size="12" fill="#fff" font-family="Arial, Helvetica, sans-serif">₹</text>
                                                                    </svg>
                                                                </span>
                                <div>
                                    <div className={`text-sm ${themeClasses.textSecondary}`}>Wallet Balance</div>
                                    <div className={`text-lg font-bold ${themeClasses.text}`}>₹{walletBalance}</div>
                                </div>
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`${themeClasses.button} p-3 rounded-full border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} transition-all duration-300 hover:scale-110`}
                        >
                                                        {isDarkMode ? (
                                                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 text-evgreen" fill="currentColor" viewBox="0 0 20 20">
                                                                <circle cx="10" cy="10" r="5" fill="currentColor" />
                                                            </svg>
                                                        )}
                        </button>
                    </div>
                </div>

                {/* Passes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {passes.map((pass) => (
                        <div
                            key={pass.id}
                            className={`relative bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${pass.popular ? 'ring-2 ring-evgreen shadow-evgreen/25' : ''
                                }`}
                            onClick={() => setSelectedPass(pass)}
                        >
                            {/* Popular Badge */}
                            {pass.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-evgreen to-green-400 text-black px-4 py-1 rounded-full text-xs font-bold">
                                        MOST POPULAR
                                    </div>
                                </div>
                            )}

                            {/* Pass Header */}
                            <div className="text-center mb-6">
                                {/* No icon for pass card header */}
                                                                <div className="mb-3 flex justify-center">
                                                                    <svg className="w-12 h-12 text-evgreen" fill="none" viewBox="0 0 32 32" stroke="currentColor">
                                                                        <rect x="6" y="10" width="20" height="12" rx="4" fill="currentColor" opacity="0.1" />
                                                                        <rect x="6" y="10" width="20" height="12" rx="4" stroke="currentColor" strokeWidth="2" />
                                                                        <path d="M10 16h12" stroke="currentColor" strokeWidth="2" />
                                                                    </svg>
                                                                </div>
                                <h3 className={`text-xl font-bold ${themeClasses.text} mb-2`}>{pass.name}</h3>
                                <div className="text-3xl font-bold text-evgreen mb-2">₹{pass.price}</div>
                                <p className={`text-sm ${themeClasses.textSecondary}`}>{pass.description}</p>
                            </div>

                            {/* Pass Details */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Duration:</span>
                                    <span className={`font-semibold ${themeClasses.text}`}>{pass.duration}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Rides:</span>
                                    <span className={`font-semibold ${themeClasses.text}`}>{pass.rides}</span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="mb-6">
                                <h4 className={`font-semibold ${themeClasses.text} mb-2`}>Features:</h4>
                                <ul className="space-y-1">
                                    {pass.features.map((feature, index) => (
                                        <li key={index} className={`text-sm ${themeClasses.textSecondary} flex items-center`}>
                                            <span className="text-evgreen mr-2">✓</span>
                                                                                        <span className="mr-2">
                                                                                            <svg className="w-4 h-4 text-evgreen" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l4 4L15 7" />
                                                                                            </svg>
                                                                                        </span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Savings Badge */}
                            <div className="mb-4">
                                <div className={`bg-gradient-to-r ${pass.color} text-white px-3 py-1 rounded-full text-xs font-semibold text-center`}>
                                    {pass.savings}
                                </div>
                            </div>

                            {/* Buy Button */}
                            <button
                                className={`w-full ${walletBalance >= pass.price
                                    ? 'bg-gradient-to-r from-evgreen to-green-400 text-black hover:from-green-400 hover:to-evgreen'
                                    : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                                    } py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${walletBalance >= pass.price ? 'hover:scale-105 shadow-lg' : ''
                                    }`}
                                disabled={walletBalance < pass.price}
                            >
                                {walletBalance >= pass.price ? `Buy Pass - ₹${pass.price}` : 'Insufficient Balance'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Benefits Section */}
                <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 border mb-8`}>
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-6 text-center`}>Why Buy a Pass? </h2>
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-6 text-center`}>Why Buy a Pass?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-4xl mb-3"></div>
                                                        <div className="mb-3 flex justify-center">
                                                            <svg className="w-8 h-8 text-evgreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <rect x="4" y="8" width="16" height="10" rx="4" fill="currentColor" opacity="0.1" />
                                                                <rect x="4" y="8" width="16" height="10" rx="4" stroke="currentColor" strokeWidth="2" />
                                                                <circle cx="18" cy="13" r="2" fill="currentColor" />
                                                            </svg>
                                                        </div>
                            <h3 className={`font-semibold ${themeClasses.text} mb-2`}>Save Money</h3>
                            <p className={themeClasses.textSecondary}>Up to 85% savings compared to pay-per-ride</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-3"></div>
                                                        <div className="mb-3 flex justify-center">
                                                            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        </div>
                            <h3 className={`font-semibold ${themeClasses.text} mb-2`}>Priority Access</h3>
                            <p className={themeClasses.textSecondary}>Skip the queue and get bikes faster</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-3"></div>
                                                        <div className="mb-3 flex justify-center">
                                                            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1" />
                                                                <circle cx="12" cy="12" r="4" fill="currentColor" />
                                                            </svg>
                                                        </div>
                            <h3 className={`font-semibold ${themeClasses.text} mb-2`}>Unlimited Rides</h3>
                            <p className={themeClasses.textSecondary}>Ride as much as you want within the duration</p>
                        </div>
                    </div>
                </div>

                {/* How it Works */}
                <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 border`}>
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-6 text-center`}>How It Works </h2>
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-6 text-center`}>How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { step: '1', icon: '', title: 'Choose Pass', desc: 'Select the perfect pass for your needs' },
                            { step: '2', icon: '', title: 'Purchase', desc: 'Buy instantly with your wallet balance' },
                            { step: '3', icon: '', title: 'Activate', desc: 'Pass activates automatically after purchase' },
                            { step: '4', icon: '', title: 'Ride', desc: 'Enjoy unlimited rides within duration' }
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-12 h-12 bg-evgreen/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-evgreen font-bold">{item.step}</span>
                                </div>
                                <div className="text-3xl mb-2">{item.icon}</div>
                                                                <div className="mb-2 flex justify-center">
                                                        
                                                                </div>
                                <h3 className={`font-semibold ${themeClasses.text} mb-2`}>{item.title}</h3>
                                <p className={`text-sm ${themeClasses.textSecondary}`}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Purchase Confirmation Modal */}
            {selectedPass && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border`}>
                        <div className="text-center">
                            <div className="text-6xl mb-4">{selectedPass.icon}</div>
                            <h3 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
                                Confirm Purchase
                            </h3>
                            <div className={`bg-gradient-to-r ${selectedPass.color} text-white rounded-lg p-4 mb-6`}>
                                <div className="text-xl font-bold">{selectedPass.name}</div>
                                <div className="text-2xl font-bold">₹{selectedPass.price}</div>
                                <div className="text-sm opacity-90">Valid for {selectedPass.duration}</div>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className={themeClasses.textSecondary}>Current Balance:</span>
                                    <span className={themeClasses.text}>₹{walletBalance}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className={themeClasses.textSecondary}>Pass Cost:</span>
                                    <span className={themeClasses.text}>-₹{selectedPass.price}</span>
                                </div>
                                <div className="border-t border-gray-600 pt-2 flex justify-between font-bold">
                                    <span className={themeClasses.text}>Remaining:</span>
                                    <span className={walletBalance >= selectedPass.price ? 'text-evgreen' : 'text-red-400'}>
                                        ₹{walletBalance - selectedPass.price}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedPass(null)}
                                    className={`flex-1 ${themeClasses.button} py-3 rounded-lg font-semibold border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} transition-all duration-300`}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleBuyPass(selectedPass)}
                                    disabled={loading || walletBalance < selectedPass.price}
                                    className={`flex-1 ${walletBalance >= selectedPass.price
                                        ? 'bg-gradient-to-r from-evgreen to-green-400 text-black hover:from-green-400 hover:to-evgreen'
                                        : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                                        } py-3 rounded-lg font-semibold transition-all duration-300 ${walletBalance >= selectedPass.price && !loading ? 'hover:scale-105' : ''
                                        }`}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                            Processing...
                                        </div>
                                    ) : (
                                        'Confirm Purchase'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyPasses;
