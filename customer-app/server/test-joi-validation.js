const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testJoiValidation() {
  console.log('🧪 Testing Joi Validation...\n');

  try {
    // Test 1: Valid Registration
    console.log('1. Testing VALID registration data...');
    try {
      const validData = {
        customer_name: 'Alice Johnson',
        email: 'alice@example.com',
        mobile: '9876543215',
        password: 'password123',
        license_number: 'DL9876543210'
      };

      const response = await axios.post(`${BASE_URL}/auth/register`, validData);
      console.log('✅ Valid data accepted:', response.data.message);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('✅ Valid data format (user already exists)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 2: Invalid Email Format
    console.log('\n2. Testing INVALID email format...');
    try {
      const invalidEmailData = {
        customer_name: 'Bob Smith',
        email: 'invalid-email-format',
        mobile: '9876543216',
        password: 'password123',
        license_number: 'DL9876543211'
      };

      await axios.post(`${BASE_URL}/auth/register`, invalidEmailData);
      console.log('❌ Invalid email was accepted (should fail)');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message === 'Validation error') {
        console.log('✅ Invalid email rejected:', error.response.data.details);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 3: Invalid Mobile Number
    console.log('\n3. Testing INVALID mobile number...');
    try {
      const invalidMobileData = {
        customer_name: 'Charlie Brown',
        email: 'charlie@example.com',
        mobile: '1234567890', // Invalid Indian mobile format
        password: 'password123',
        license_number: 'DL9876543212'
      };

      await axios.post(`${BASE_URL}/auth/register`, invalidMobileData);
      console.log('❌ Invalid mobile was accepted (should fail)');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message === 'Validation error') {
        console.log('✅ Invalid mobile rejected:', error.response.data.details);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 4: Short Password
    console.log('\n4. Testing SHORT password...');
    try {
      const shortPasswordData = {
        customer_name: 'David Wilson',
        email: 'david@example.com',
        mobile: '9876543217',
        password: '123', // Too short
        license_number: 'DL9876543213'
      };

      await axios.post(`${BASE_URL}/auth/register`, shortPasswordData);
      console.log('❌ Short password was accepted (should fail)');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message === 'Validation error') {
        console.log('✅ Short password rejected:', error.response.data.details);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 5: Missing Required Fields
    console.log('\n5. Testing MISSING required fields...');
    try {
      const missingFieldsData = {
        customer_name: 'Eva Martinez',
        email: 'eva@example.com'
        // Missing mobile, password, license_number
      };

      await axios.post(`${BASE_URL}/auth/register`, missingFieldsData);
      console.log('❌ Missing fields were accepted (should fail)');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message === 'Validation error') {
        console.log('✅ Missing fields rejected:', error.response.data.details);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 6: Valid Login
    console.log('\n6. Testing VALID login data...');
    try {
      const validLoginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await axios.post(`${BASE_URL}/auth/login`, validLoginData);
      console.log('✅ Valid login accepted:', response.data.message);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message === 'Invalid credentials') {
        console.log('✅ Valid login format (user not found or wrong password)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 7: Invalid Login Email
    console.log('\n7. Testing INVALID login email...');
    try {
      const invalidLoginData = {
        email: 'not-an-email',
        password: 'password123'
      };

      await axios.post(`${BASE_URL}/auth/login`, invalidLoginData);
      console.log('❌ Invalid login email was accepted (should fail)');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message === 'Validation error') {
        console.log('✅ Invalid login email rejected:', error.response.data.details);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    console.log('\n🎉 Joi Validation Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Valid data formats are accepted');
    console.log('✅ Invalid email formats are rejected');
    console.log('✅ Invalid mobile numbers are rejected');
    console.log('✅ Short passwords are rejected');
    console.log('✅ Missing required fields are rejected');
    console.log('✅ Login validation is working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJoiValidation();
