import React, { useState, useRef, useEffect } from 'react';

const QRScanner = ({ onScan, onClose, stationId }) => {
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState('');
    const [hasPermission, setHasPermission] = useState(null);
    const [manuallyEnteredId, setManuallyEnteredId] = useState('');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualIdInput, setManualIdInput] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && true);
    });

    const themeClasses = {
        bg: isDarkMode ? 'from-black via-gray-900 to-black' : 'from-gray-50 via-white to-gray-100',
        card: isDarkMode ? 'from-gray-800/90 to-gray-900/90 border-evgreen/20' : 'from-white/90 to-gray-50/90 border-evgreen/30',
        text: isDarkMode ? 'text-white' : 'text-gray-900',
        textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        button: isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-white/50 hover:bg-gray-100/50'
    };

    useEffect(() => {
        let qrScanner = null;

        const initializeScanner = async () => {
            try {
                // Request camera permission
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } // Use back camera if available
                });

                setHasPermission(true);
                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    // Import QR scanner dynamically to avoid SSR issues
                    const { default: QrScanner } = await import('qr-scanner');

                    qrScanner = new QrScanner(
                        videoRef.current,
                        (result) => {
                            console.log('QR Code detected:', result.data);
                            handleQRScan(result.data, false);
                        },
                        {
                            onDecodeError: (error) => {
                                // Silent error handling for continuous scanning
                                console.log('QR decode error:', error);
                            },
                            preferredCamera: 'environment',
                            highlightScanRegion: true,
                            highlightCodeOutline: true,
                        }
                    );

                    await qrScanner.start();
                    setIsScanning(true);
                }
            } catch (err) {
                console.error('Error initializing QR scanner:', err);
                setError('Failed to access camera. Please allow camera permissions.');
                setHasPermission(false);
            }
        };

        initializeScanner();

        return () => {
            if (qrScanner) {
                qrScanner.stop();
                qrScanner.destroy();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleQRScan = async (qrData, isManual = false) => {
        try {
            setIsScanning(false);

            // Clean the QR data
            let vehicleIdentifier = qrData.trim();

            // Parse QR code data if it's JSON format
            try {
                const parsedData = JSON.parse(qrData);
                vehicleIdentifier = parsedData.vehicle_id || parsedData.id || parsedData.qr_code || qrData;
            } catch {
                // Not JSON, use as-is
                vehicleIdentifier = qrData;
            }

            if (!vehicleIdentifier) {
                throw new Error('Invalid QR code format');
            }

            console.log(`Vehicle Identifier: ${vehicleIdentifier} ${isManual ? '(Manually Entered)' : '(QR Scanned)'}`);

            // If manually entered, show confirmation
            if (isManual) {
                setManuallyEnteredId(vehicleIdentifier);
            }

            // Use the vehicles scan API which handles both QR codes and vehicle IDs
            const response = await fetch(`http://localhost:5000/api/vehicles/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ qr_code: vehicleIdentifier })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to verify vehicle availability');
            }

            const result = await response.json();
            console.log('Vehicle scan result:', result);

            // Call parent component's onScan callback
            onScan({
                vehicleId: vehicleIdentifier,
                stationId,
                vehicleData: result.vehicle,
                entryMethod: isManual ? 'manual' : 'qr_scan'
            });

        } catch (err) {
            console.error('QR scan error:', err);
            setError(err.message);
            setIsScanning(true); // Resume scanning on error
            if (isManual) {
                setManuallyEnteredId('');
            }
        }
    };

    const handleManualEntry = () => {
        setShowManualEntry(true);
        setError(''); // Clear any existing errors
        setManualIdInput('');
    };

    const handleManualSubmit = () => {
        if (manualIdInput && manualIdInput.trim()) {
            handleQRScan(manualIdInput.trim(), true);
            setShowManualEntry(false);
        } else {
            setError('Please enter a valid Vehicle ID');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-6 m-4 max-w-md w-full border shadow-2xl`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                            {manuallyEnteredId ? 'Vehicle ID Confirmed' : 'Scan QR Code'}
                        </h3>
                        <p className={`${themeClasses.textSecondary} text-sm`}>
                            {manuallyEnteredId ? `Manually entered: ${manuallyEnteredId}` : 'Point camera at vehicle QR code'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${themeClasses.button} p-2 rounded-xl transition-all duration-300 hover:scale-110`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Manual Entry Success Display */}
                {manuallyEnteredId && (
                    <div className="bg-evgreen/20 border border-evgreen/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="w-8 h-8 text-evgreen mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-evgreen font-semibold">Manually Entered Vehicle ID:</p>
                                    <p className="text-evgreen text-xl font-mono font-bold bg-evgreen/10 px-3 py-1 rounded-lg inline-block mt-1">
                                        {manuallyEnteredId}
                                    </p>
                                </div>
                            </div>
                            <div className="text-evgreen">
                                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3 p-3 bg-evgreen/10 rounded-lg">
                            <p className="text-evgreen text-sm">
                                <strong>Entry Method:</strong> Manual Input<br />
                                <strong>Station:</strong> {stationId}<br />
                                <strong>Status:</strong> Verifying vehicle availability...
                            </p>
                        </div>
                    </div>
                )}

                {/* Camera Preview - Hide when manual ID is confirmed */}
                {!manuallyEnteredId && (
                    <div className="relative mb-6">
                        {hasPermission === null && (
                            <div className="flex items-center justify-center h-64 bg-gray-800 rounded-xl">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-evgreen"></div>
                            </div>
                        )}

                        {hasPermission === false && (
                            <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-xl">
                                <svg className="w-16 h-16 text-red-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                </svg>
                                <p className="text-red-400 text-center">Camera access denied</p>
                            </div>
                        )}

                        {hasPermission === true && (
                            <div className="relative">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-64 object-cover rounded-xl bg-black"
                                />

                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        {/* Scanning Frame */}
                                        <div className="w-48 h-48 border-4 border-evgreen rounded-2xl relative overflow-hidden">
                                            <div className="absolute inset-0 border-4 border-transparent">
                                                {/* Corner indicators */}
                                                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-evgreen"></div>
                                                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-evgreen"></div>
                                                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-evgreen"></div>
                                                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-evgreen"></div>
                                            </div>

                                            {/* Animated scanning line */}
                                            {isScanning && (
                                                <div className="absolute inset-0 overflow-hidden">
                                                    <div className="w-full h-1 bg-evgreen opacity-80 animate-ping"></div>
                                                    <div className="w-full h-1 bg-evgreen/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Instructions */}
                                        <p className="text-center text-white text-sm mt-4 bg-black/50 px-3 py-1 rounded-full">
                                            {isScanning ? 'Scanning...' : 'Processing...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Manual Entry Form */}
                {showManualEntry && !manuallyEnteredId && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                        <h4 className="text-blue-400 font-semibold mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                            </svg>
                            Enter Vehicle ID Manually
                        </h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="e.g., BIKE001, EV123, SCOOT456"
                                value={manualIdInput}
                                onChange={(e) => setManualIdInput(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-blue-500/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                autoFocus
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleManualSubmit();
                                    }
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleManualSubmit}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                                >
                                    Submit ID
                                </button>
                                <button
                                    onClick={() => {
                                        setShowManualEntry(false);
                                        setError('');
                                        setManualIdInput('');
                                    }}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons - Hide when manual ID is confirmed */}
                {!manuallyEnteredId && (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleManualEntry}
                            disabled={showManualEntry}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                                </svg>
                                {showManualEntry ? 'Manual Entry Active' : 'Enter Vehicle ID Manually'}
                            </div>
                        </button>

                        <button
                            onClick={onClose}
                            className={`${themeClasses.button} border px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105`}
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 p-4 bg-evgreen/10 rounded-xl">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-evgreen mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-evgreen text-sm font-medium mb-1">
                                {manuallyEnteredId ? 'Manual Entry Successful:' : 'How to scan:'}
                            </p>
                            <ul className="text-evgreen/80 text-xs space-y-1">
                                {manuallyEnteredId ? (
                                    <>
                                        <li>• Vehicle ID: <strong className="text-evgreen">{manuallyEnteredId}</strong></li>
                                        <li>• Entry method: <strong className="text-evgreen">Manual input</strong></li>
                                        <li>• Please wait while we verify availability</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Hold phone steady and align QR code in frame</li>
                                        <li>• Ensure good lighting for better scanning</li>
                                        <li>• QR code should be clearly visible</li>
                                        <li>• Use manual entry if scanning fails</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scanLine 2s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default QRScanner;
