// Frontend JavaScript helper for ride session management
class RideSessionManager {
  constructor(apiBaseUrl = 'http://localhost:5000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.sessionId = this.generateSessionId();
    this.pingInterval = null;
    this.currentLocation = null;
    this.lastLocation = null;
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Check for active ride when user loads the app
  async checkActiveRide() {
    try {
      const token = localStorage.getItem('bolt_ride_token');
      if (!token) return { has_active_ride: false };

      const response = await fetch(`${this.apiBaseUrl}/sessions/check-active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.has_active_ride) {
        console.log('Active ride detected:', data.ride_session);
        // Start ping interval to keep session alive
        this.startSessionPing();
        
        // Show ride page with current data
        this.redirectToRidePage(data.ride_session);
      }

      return data;
    } catch (error) {
      console.error('Error checking active ride:', error);
      return { has_active_ride: false };
    }
  }

  // Start a new ride session
  async startRideSession(rideId, vehicleId, latitude, longitude) {
    try {
      const token = localStorage.getItem('bolt_ride_token');
      const response = await fetch(`${this.apiBaseUrl}/sessions/start-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ride_id: rideId,
          vehicle_id: vehicleId,
          latitude,
          longitude,
          browser_session_id: this.sessionId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Start location tracking and session pinging
        this.startLocationTracking();
        this.startSessionPing();
        
        // Store ride info in localStorage for persistence
        localStorage.setItem('active_ride', JSON.stringify({
          ride_id: rideId,
          vehicle_id: vehicleId,
          start_time: new Date().toISOString()
        }));
      }

      return data;
    } catch (error) {
      console.error('Error starting ride session:', error);
      throw error;
    }
  }

  // End ride session
  async endRideSession(rideId) {
    try {
      const token = localStorage.getItem('bolt_ride_token');
      const response = await fetch(`${this.apiBaseUrl}/sessions/end-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ride_id: rideId })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Stop tracking and pinging
        this.stopLocationTracking();
        this.stopSessionPing();
        
        // Clear local storage
        localStorage.removeItem('active_ride');
      }

      return data;
    } catch (error) {
      console.error('Error ending ride session:', error);
      throw error;
    }
  }

  // Start pinging server to keep session alive
  startSessionPing() {
    if (this.pingInterval) return; // Already running

    this.pingInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('bolt_ride_token');
        const distanceIncrement = this.calculateDistanceIncrement();
        
        await fetch(`${this.apiBaseUrl}/sessions/update-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            latitude: this.currentLocation?.latitude,
            longitude: this.currentLocation?.longitude,
            distance_increment: distanceIncrement
          })
        });
      } catch (error) {
        console.error('Session ping failed:', error);
      }
    }, 30000); // Ping every 30 seconds
  }

  stopSessionPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Start location tracking
  startLocationTracking() {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.watchPosition(
      (position) => {
        this.lastLocation = this.currentLocation;
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };
        
        // Update UI with new location
        this.updateLocationOnUI(this.currentLocation);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      options
    );
  }

  stopLocationTracking() {
    // Note: navigator.geolocation.clearWatch() would be used with watchId
    // For simplicity, we'll just stop the ping interval
  }

  // Calculate distance increment since last ping
  calculateDistanceIncrement() {
    if (!this.lastLocation || !this.currentLocation) return 0;

    const R = 6371; // Earth's radius in km
    const dLat = (this.currentLocation.latitude - this.lastLocation.latitude) * Math.PI / 180;
    const dLng = (this.currentLocation.longitude - this.lastLocation.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.lastLocation.latitude * Math.PI / 180) * 
              Math.cos(this.currentLocation.latitude * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Redirect to ride page (implement based on your routing)
  redirectToRidePage(rideSession) {
    // This depends on your frontend routing
    console.log('Redirecting to ride page with session:', rideSession);
    
    // Example for React Router:
    // window.location.href = `/ride/${rideSession.ride_id}`;
    
    // Or dispatch a Redux action, or call a React Router navigate function
    // You'll need to implement this based on your frontend framework
    
    // For vanilla JS:
    window.location.hash = `#/ride/${rideSession.ride_id}`;
    
    // Display ride data immediately
    this.displayRideData(rideSession);
  }

  // Update UI with location data
  updateLocationOnUI(location) {
    // Update map center, distance counter, etc.
    console.log('Location updated:', location);
    
    // Example DOM updates:
    const latElement = document.getElementById('current-lat');
    const lngElement = document.getElementById('current-lng');
    
    if (latElement) latElement.textContent = location.latitude.toFixed(6);
    if (lngElement) lngElement.textContent = location.longitude.toFixed(6);
  }

  // Display ride data on UI
  displayRideData(rideSession) {
    const {
      ride_id,
      vehicle_name,
      vehicle_battery,
      elapsed_minutes,
      total_distance,
      estimated_fare
    } = rideSession;

    // Update DOM elements
    const rideIdElement = document.getElementById('ride-id');
    const vehicleNameElement = document.getElementById('vehicle-name');
    const batteryElement = document.getElementById('vehicle-battery');
    const timeElement = document.getElementById('elapsed-time');
    const distanceElement = document.getElementById('total-distance');
    const fareElement = document.getElementById('estimated-fare');

    if (rideIdElement) rideIdElement.textContent = ride_id;
    if (vehicleNameElement) vehicleNameElement.textContent = vehicle_name;
    if (batteryElement) batteryElement.textContent = `${vehicle_battery}%`;
    if (timeElement) timeElement.textContent = `${elapsed_minutes} min`;
    if (distanceElement) distanceElement.textContent = `${total_distance.toFixed(2)} km`;
    if (fareElement) fareElement.textContent = `₹${estimated_fare.toFixed(2)}`;
  }

  // Initialize on page load
  async init() {
    // Check for active ride when app loads
    await this.checkActiveRide();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden - reduce ping frequency or stop
        console.log('Page hidden - maintaining session');
      } else {
        // Page is visible - resume normal operation
        console.log('Page visible - resuming normal operation');
        this.checkActiveRide(); // Re-check for active ride
      }
    });

    // Handle beforeunload (user trying to close/refresh)
    window.addEventListener('beforeunload', (event) => {
      const activeRide = localStorage.getItem('active_ride');
      if (activeRide) {
        event.preventDefault();
        event.returnValue = 'You have an active ride. Are you sure you want to leave?';
        return 'You have an active ride. Are you sure you want to leave?';
      }
    });
  }
}

// Usage example:
/*
const rideManager = new RideSessionManager();

// Initialize on app load
rideManager.init();

// When starting a ride
await rideManager.startRideSession('RIDE_123', 'VH_1001_1', 28.6139, 77.2090);

// When ending a ride
await rideManager.endRideSession('RIDE_123');
*/

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RideSessionManager;
}
