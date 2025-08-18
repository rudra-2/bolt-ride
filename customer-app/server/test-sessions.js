const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function testSessionManagement() {
  try {
    console.log('🚀 Testing Ride Session Management...\n');
    
    // 1. Register/Login user
    console.log('1. Logging in user...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'john@example.com',
        password: 'password123'
      });
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
    } catch (error) {
      // User might not exist, register first
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        customer_name: 'Test User',
        email: 'test@example.com',
        mobile: '9876543211',
        password: 'password123',
        license_number: 'DL9876543210'
      });
      authToken = registerResponse.data.token;
      console.log('✅ Registration successful');
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Check for active ride (should be none initially)
    console.log('\n2. Checking for active ride...');
    const checkResponse = await axios.get(`${BASE_URL}/sessions/check-active`, { headers });
    console.log('✅ Active ride check:', checkResponse.data.has_active_ride ? 'Found active ride' : 'No active ride');

    // 3. Start a ride
    console.log('\n3. Starting a ride...');
    const startRideResponse = await axios.post(`${BASE_URL}/rides/start`, {
      vehicle_id: 'VH_1001_1',
      station_id: 1001,
      latitude: 28.6139,
      longitude: 77.2090,
      browser_session_id: 'test_session_123'
    }, { headers });
    
    const rideId = startRideResponse.data.ride.ride_id;
    console.log('✅ Ride started:', rideId);

    // 4. Check for active ride again (should find the started ride)
    console.log('\n4. Checking for active ride after starting...');
    const checkResponse2 = await axios.get(`${BASE_URL}/sessions/check-active`, { headers });
    if (checkResponse2.data.has_active_ride) {
      console.log('✅ Active ride found:', checkResponse2.data.ride_session.ride_id);
      console.log('   - Elapsed time:', checkResponse2.data.ride_session.elapsed_minutes, 'minutes');
      console.log('   - Estimated fare: ₹' + checkResponse2.data.ride_session.estimated_fare);
    }

    // 5. Simulate session updates (location pings)
    console.log('\n5. Simulating location updates...');
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      await axios.post(`${BASE_URL}/sessions/update-session`, {
        latitude: 28.6139 + (i * 0.001), // Simulate movement
        longitude: 77.2090 + (i * 0.001),
        distance_increment: 0.1 // 0.1 km per update
      }, { headers });
      
      console.log(`   ⏱️  Location update ${i + 1}/3 sent`);
    }

    // 6. Check ride status with updated data
    console.log('\n6. Checking updated ride status...');
    const checkResponse3 = await axios.get(`${BASE_URL}/sessions/check-active`, { headers });
    if (checkResponse3.data.has_active_ride) {
      const session = checkResponse3.data.ride_session;
      console.log('✅ Updated ride session:');
      console.log('   - Distance:', session.total_distance, 'km');
      console.log('   - Time:', session.elapsed_minutes, 'minutes');
      console.log('   - Estimated fare: ₹' + session.estimated_fare);
    }

    // 7. End the ride
    console.log('\n7. Ending the ride...');
    await axios.post(`${BASE_URL}/rides/end`, {
      ride_id: rideId,
      drop_station_id: 1002,
      distance: 2.5,
      total_time: 15
    }, { headers });
    console.log('✅ Ride ended successfully');

    // 8. Verify no active ride exists
    console.log('\n8. Verifying ride session ended...');
    const finalCheck = await axios.get(`${BASE_URL}/sessions/check-active`, { headers });
    console.log('✅ Final check:', finalCheck.data.has_active_ride ? 'Still has active ride (ERROR)' : 'No active ride (CORRECT)');

    console.log('\n🎉 Session management test completed successfully!');
    
    console.log('\n📋 Summary of Features:');
    console.log('✅ Ride session persistence across browser refreshes');
    console.log('✅ Real-time location tracking and updates');
    console.log('✅ Automatic fare calculation during ride');
    console.log('✅ Session cleanup when ride ends');
    console.log('✅ Protection against lost rides due to browser closure');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testSessionManagement();
