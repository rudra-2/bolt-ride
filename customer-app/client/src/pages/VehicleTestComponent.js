import React, { useState } from 'react';
import { vehiclesAPI } from '../api';

const VehicleTestComponent = () => {
  const [testInput, setTestInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testVehicleLookup = async () => {
    if (!testInput.trim()) {
      setError('Please enter a vehicle ID or QR code');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing vehicle lookup for:', testInput);
      
      // Test the scan API
      const response = await vehiclesAPI.scan(testInput.trim());
      
      console.log('API Response:', response.data);
      setResult({
        success: true,
        message: response.data.message,
        vehicle: response.data.vehicle
      });
      
    } catch (err) {
      console.error('Vehicle lookup error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to lookup vehicle');
      setResult({
        success: false,
        error: err.response?.data?.message || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      testVehicleLookup();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-evgreen mb-8">Vehicle Lookup Test</h1>
        
        {/* Test Input */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
          <h2 className="text-xl font-bold mb-4">Test Vehicle ID or QR Code</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Enter Vehicle ID (e.g., VH0001) or QR Code (e.g., QR000001)"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-evgreen"
            />
            <button
              onClick={testVehicleLookup}
              disabled={loading || !testInput.trim()}
              className="bg-evgreen hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Testing...' : 'Test Lookup'}
            </button>
          </div>

          <div className="text-sm text-gray-400">
            <p><strong>Available Test Cases:</strong></p>
            <p>• Valid Vehicle IDs: VH0001, VH0002, VH0003, VH0105</p>
            <p>• Valid QR Codes: QR000001, QR000002, QR000003, QR000105</p>
            <p>• Invalid: BIKE001, EV123, INVALID123</p>
          </div>
        </div>

        {/* Error Display */}
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

        {/* Result Display */}
        {result && (
          <div className={`rounded-xl p-6 border ${result.success ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
            <h3 className={`text-xl font-bold mb-4 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? '✅ Vehicle Found!' : '❌ Lookup Failed'}
            </h3>
            
            {result.success && result.vehicle ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-300">Vehicle ID</p>
                  <p className="text-lg font-semibold text-evgreen">{result.vehicle.vehicle_id}</p>
                </div>
                <div>
                  <p className="text-gray-300">Vehicle Name</p>
                  <p className="text-lg font-semibold">{result.vehicle.vehicle_name}</p>
                </div>
                <div>
                  <p className="text-gray-300">Vehicle Number</p>
                  <p className="text-lg font-semibold">{result.vehicle.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-gray-300">Type</p>
                  <p className="text-lg font-semibold">{result.vehicle.type}</p>
                </div>
                <div>
                  <p className="text-gray-300">Battery Level</p>
                  <p className={`text-lg font-semibold ${result.vehicle.battery > 50 ? 'text-green-400' : result.vehicle.battery > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.vehicle.battery}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-300">Status</p>
                  <p className={`text-lg font-semibold ${result.vehicle.status === 'available' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {result.vehicle.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-300">Station ID</p>
                  <p className="text-lg font-semibold">{result.vehicle.station_id}</p>
                </div>
                <div>
                  <p className="text-gray-300">QR Code</p>
                  <p className="text-lg font-semibold font-mono">{result.vehicle.qr_code}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-300">Error: {result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Authentication Status */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mt-6 border border-gray-700/50">
          <h3 className="text-lg font-bold mb-3">Authentication Status</h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-400">Token: </span>
              <span className={localStorage.getItem('token') ? 'text-green-400' : 'text-red-400'}>
                {localStorage.getItem('token') ? 'Present' : 'Missing'}
              </span>
            </p>
            <p>
              <span className="text-gray-400">User: </span>
              <span className={localStorage.getItem('user') ? 'text-green-400' : 'text-red-400'}>
                {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Not logged in'}
              </span>
            </p>
          </div>
          {!localStorage.getItem('token') && (
            <p className="text-yellow-400 text-sm mt-2">
              ⚠️ You need to log in first to test vehicle lookup
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTestComponent;
