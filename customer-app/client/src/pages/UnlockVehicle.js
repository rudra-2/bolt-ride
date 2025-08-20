import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { startRide, getVehicleDetails, getVehicleByQR, vehiclesAPI } from '../api';

const UnlockVehicle = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedStation, userLocation } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannedVehicleId, setScannedVehicleId] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  useEffect(() => {
    if (!selectedStation) {
      navigate('/dashboard');
      return;
    }

    // Only initialize QR Scanner if not in manual entry mode and no vehicle details
    if (!manualEntry && !vehicleDetails && scannerActive) {
      initializeScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [selectedStation, navigate, manualEntry, vehicleDetails, scannerActive]);

  const initializeScanner = () => {
    // Clear any existing scanner first
    cleanupScanner();

    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    qrScanner.render(onScanSuccess, onScanFailure);
    setScanner(qrScanner);
  };

  const cleanupScanner = () => {
    if (scanner) {
      try {
        scanner.clear();
      } catch (error) {
        console.log('Scanner cleanup error:', error);
      }
      setScanner(null);
    }
  };

  const onScanSuccess = (decodedText) => {
    setScannedVehicleId(decodedText);
    validateVehicle(decodedText);
    cleanupScanner();
    setScannerActive(false);
  };

  const onScanFailure = (error) => {
    // Handle scan failure silently
  };

  const validateVehicle = async (vehicleId) => {
    setLoading(true);
    setError('');

    try {
      console.log('Validating vehicle:', vehicleId);

      // Use the scan endpoint which handles both QR codes and vehicle IDs
      const response = await vehiclesAPI.scan(vehicleId);
      const vehicle = response.data.vehicle;
      
      console.log('Vehicle found:', vehicle);

      if (!vehicle) {
        setError('Vehicle not found');
        return;
      }

      // Check if vehicle is available
      if (vehicle.status !== 'available') {
        setError(`Vehicle is ${vehicle.status}. Not available for rent.`);
        return;
      }

      // Check if vehicle is at correct station (if we have station info)
      if (selectedStation && vehicle.station_id && vehicle.station_id.toString() !== selectedStation.station_id.toString()) {
        setError(`Vehicle is not at ${selectedStation.station_name}. Please scan a vehicle at this station.`);
        return;
      }

      // Check battery level
      if (vehicle.battery < 20) {
        setError(`Vehicle battery is too low (${vehicle.battery}%). Please choose another vehicle.`);
        return;
      }

      setVehicleDetails(vehicle);
    } catch (err) {
      console.error('Error validating vehicle:', err);
      const errorMessage = err.response?.data?.message || 'Vehicle not found or invalid QR code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!vehicleDetails) return;

    setLoading(true);
    try {
      const rideResponse = await startRide({
        vehicle_id: vehicleDetails.vehicle_id,
        start_station_id: selectedStation.station_id,
        start_location: {
          latitude: userLocation.lat,
          longitude: userLocation.lng
        }
      });

      console.log('Start ride response:', rideResponse);

      // Navigate to active ride with ride details
      navigate('/active-ride', {
        state: {
          rideId: rideResponse.data.ride?.ride_id || rideResponse.data.ride_id,
          vehicleDetails,
          startStation: selectedStation,
          userLocation
        }
      });
    } catch (err) {
      console.error('Start ride error:', err);
      setError(err.response?.data?.message || 'Failed to start ride');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    if (scannedVehicleId.trim()) {
      // Stop scanner when switching to manual entry
      cleanupScanner();
      setScannerActive(false);
      validateVehicle(scannedVehicleId.trim());
    }
  };

  const toggleManualEntry = () => {
    const newManualEntry = !manualEntry;
    setManualEntry(newManualEntry);
    
    if (newManualEntry) {
      // Switching to manual entry - stop scanner
      cleanupScanner();
      setScannerActive(false);
    } else {
      // Switching back to scanner - restart it if no vehicle details
      if (!vehicleDetails) {
        setScannerActive(true);
      }
    }
  };

  const resetVehicleSelection = () => {
    setVehicleDetails(null);
    setScannedVehicleId('');
    setError('');
    setManualEntry(false);
    setScannerActive(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-evgreen">Unlock Vehicle</h1>
        </div>

        {/* Station Info */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
          <h2 className="text-xl font-bold mb-4">Station Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300">Station Name</p>
              <p className="text-lg font-semibold">{selectedStation?.station_name}</p>
            </div>
            <div>
              <p className="text-gray-300">Available Bikes</p>
              <p className="text-lg font-semibold text-evgreen">{selectedStation?.available_bikes || 'N/A'}</p>
            </div>
          </div>
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

        {/* QR Scanner Section */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
          <h2 className="text-xl font-bold mb-4">Scan Vehicle QR Code</h2>
          
          {!vehicleDetails && (
            <div className="space-y-6">
              {/* QR Scanner */}
              {!manualEntry && scannerActive && (
                <div className="flex justify-center">
                  <div id="qr-reader" className="w-full max-w-md"></div>
                </div>
              )}

              {/* Manual Entry Option */}
              <div className="text-center">
                <button
                  onClick={toggleManualEntry}
                  className="text-evgreen hover:text-green-400 transition-colors"
                >
                  {manualEntry ? 'Switch to QR Scanner' : 'Having trouble? Enter Vehicle ID manually'}
                </button>
              </div>

              {manualEntry && (
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter Vehicle ID"
                    value={scannedVehicleId}
                    onChange={(e) => setScannedVehicleId(e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-evgreen"
                  />
                  <button
                    onClick={handleManualEntry}
                    disabled={!scannedVehicleId.trim() || loading}
                    className="bg-evgreen hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Validate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        {vehicleDetails && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
            <h2 className="text-xl font-bold mb-4 text-evgreen">Vehicle Found!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-300">Vehicle ID</p>
                <p className="text-lg font-semibold">{vehicleDetails.vehicle_id}</p>
              </div>
              <div>
                <p className="text-gray-300">Vehicle Name</p>
                <p className="text-lg font-semibold">{vehicleDetails.vehicle_name}</p>
              </div>
              <div>
                <p className="text-gray-300">Vehicle Number</p>
                <p className="text-lg font-semibold">{vehicleDetails.vehicle_number}</p>
              </div>
              <div>
                <p className="text-gray-300">Vehicle Type</p>
                <p className="text-lg font-semibold">{vehicleDetails.type}</p>
              </div>
              <div>
                <p className="text-gray-300">Model</p>
                <p className="text-lg font-semibold">{vehicleDetails.model}</p>
              </div>
              <div>
                <p className="text-gray-300">Battery Level</p>
                <p className={`text-lg font-semibold ${vehicleDetails.battery > 50 ? 'text-green-400' : vehicleDetails.battery > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {vehicleDetails.battery}%
                </p>
              </div>
              <div>
                <p className="text-gray-300">Odometer Reading</p>
                <p className="text-lg font-semibold">{vehicleDetails.odometer_reading} km</p>
              </div>
              <div>
                <p className="text-gray-300">Status</p>
                <p className="text-lg font-semibold text-green-400">Available</p>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-2">Rental Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-300">Per KM</p>
                  <p className="text-evgreen font-bold">₹{vehicleDetails.rental_rate?.per_km || 5}</p>
                </div>
                <div>
                  <p className="text-gray-300">Per Hour</p>
                  <p className="text-evgreen font-bold">₹{vehicleDetails.rental_rate?.per_hour || 30}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStartRide}
                disabled={loading}
                className="flex-1 bg-evgreen hover:bg-green-600 disabled:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105"
              >
                {loading ? 'Starting Ride...' : 'Start Ride'}
              </button>
              
              <button
                onClick={resetVehicleSelection}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition-colors"
              >
                Scan Different
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold mb-3">Instructions</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-evgreen mr-2">1.</span>
              Point your camera at the QR code on the vehicle
            </li>
            <li className="flex items-start">
              <span className="text-evgreen mr-2">2.</span>
              Wait for the scanner to detect the QR code
            </li>
            <li className="flex items-start">
              <span className="text-evgreen mr-2">3.</span>
              Verify vehicle details and start your ride
            </li>
            <li className="flex items-start">
              <span className="text-evgreen mr-2">4.</span>
              Ensure you have sufficient wallet balance for the ride
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UnlockVehicle;
