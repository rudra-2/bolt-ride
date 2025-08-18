const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🚀 Testing Bolt Ride Customer API...\n');
    
    // Test basic endpoint
    console.log('1. Testing basic endpoint...');
    const testResponse = await axios.get(`${BASE_URL}/test`);
    console.log('✅ Test endpoint:', testResponse.data.message);
    
    // Test registration
    console.log('\n2. Testing user registration...');
    const registerData = {
      customer_name: 'John Doe',
      email: 'john@example.com',
      mobile: '9876543210',
      password: 'password123',
      license_number: 'DL1234567890'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful');
    console.log('Customer ID:', registerResponse.data.customer.customer_id);
    console.log('Starting wallet balance: ₹' + registerResponse.data.customer.wallet);
    
    const token = registerResponse.data.token;
    
    // Test nearby stations
    console.log('\n3. Testing nearby stations...');
    const stationsResponse = await axios.get(`${BASE_URL}/stations/nearby?lat=28.6139&lng=77.2090`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Found', stationsResponse.data.stations.length, 'nearby stations');
    console.log('Nearest station:', stationsResponse.data.stations[0].station_name);
    
    // Test vehicles at station
    console.log('\n4. Testing vehicles at station...');
    const stationId = stationsResponse.data.stations[0].station_id;
    const vehiclesResponse = await axios.get(`${BASE_URL}/stations/${stationId}/vehicles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Found', vehiclesResponse.data.vehicles.length, 'available vehicles');
    
    // Test wallet balance
    console.log('\n5. Testing wallet balance...');
    const walletResponse = await axios.get(`${BASE_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Current wallet balance: ₹' + walletResponse.data.wallet_balance);
    
    console.log('\n🎉 All tests passed! API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testAPI();
