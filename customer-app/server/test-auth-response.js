// Test script to check the login API response
const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Testing login API...');
    
    // First, let's register a test user
    const registerData = {
      customer_name: "Test User",
      email: "test@example.com",
      mobile: "9876543210",
      password: "password123",
      license_number: "DL1234567890"
    };

    console.log('Registering test user...');
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', registerData);
    console.log('Register Response:', JSON.stringify(registerResponse.data, null, 2));

  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('Test user already exists, trying to login...');
      
      // Try to login with existing user
      const loginData = {
        email: "test@example.com",
        password: "password123"
      };

      try {
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
        console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
      } catch (loginError) {
        console.error('Login Error:', loginError.response?.data || loginError.message);
      }
    } else {
      console.error('Registration Error:', error.response?.data || error.message);
    }
  }
};

testLogin();
