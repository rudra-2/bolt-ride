# 🚀 Bolt Ride Customer Backend - Complete Setup

## ✅ What's Been Created

### 📁 Project Structure
```
customer-app/server/
├── models/           # MongoDB Mongoose models
│   ├── Customer.js
│   ├── ParkingStation.js
│   ├── Vehicle.js
│   ├── RideHistory.js
│   ├── RidePass.js
│   └── Port.js
├── routes/           # API route handlers
│   ├── auth.js       # Registration & Login
│   ├── stations.js   # Station & nearby search
│   ├── vehicles.js   # Vehicle management & QR scanning
│   ├── rides.js      # Ride flow & history
│   ├── wallet.js     # Wallet management
│   ├── passes.js     # Monthly/weekly passes
│   └── profile.js    # Profile management
├── middleware/
│   └── auth.js       # JWT authentication middleware
├── index.js          # Main Express server
├── seedData.js       # Sample data seeder
├── test-api.js       # API testing script
├── .env              # Environment variables
├── API_DOCS.md       # Complete API documentation
└── package.json      # Dependencies & scripts
```

## 🎯 Features Implemented

### 🔐 Authentication & Security
- ✅ User registration with auto-generated customer IDs
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Protected routes with middleware

### 🏢 Station Management
- ✅ Nearby station discovery with distance calculation
- ✅ Station details & capacity info
- ✅ Available vehicles at each station
- ✅ Real-time vehicle status tracking

### 🚗 Vehicle & Ride Management
- ✅ QR code scanning for vehicle unlock
- ✅ Complete ride flow (start → ride → end)
- ✅ Dynamic fare calculation (₹5 base + ₹2/km + ₹1/min)
- ✅ Battery simulation & tracking
- ✅ Vehicle status management

### 💰 Wallet & Payments
- ✅ Wallet balance management
- ✅ Add money functionality
- ✅ Automatic fare deduction
- ✅ Transaction history

### 🎫 Subscription Management
- ✅ Monthly passes (₹999)
- ✅ Weekly passes (₹299)
- ✅ Pass validation & history

### 📊 User Features
- ✅ Ride history with complete details
- ✅ Profile management
- ✅ Password change functionality
- ✅ Geofencing alerts

### 🛡️ Security Features
- ✅ Theft protection alerts
- ✅ Boundary violation tracking
- ✅ Wallet balance validation
- ✅ Vehicle availability checks

## 📊 Sample Data Included
- **5 Parking Stations** across different areas in Delhi
- **25 Vehicles** (5 per station) with varying battery levels
- **Charging Ports** for each station
- **Starting Bonus**: ₹100 for new users

## 🚀 Getting Started

### Prerequisites
- Node.js & npm installed
- MongoDB running locally

### Quick Start
```bash
# 1. Navigate to server directory
cd customer-app/server

# 2. Install dependencies
npm install

# 3. Start MongoDB (if not running)
# mongod

# 4. Seed sample data
npm run seed

# 5. Start development server
npm run dev

# 6. Test API
node test-api.js
```

## 📚 API Documentation

### Base URL: `http://localhost:5000/api`

### Key Endpoints:
- **POST** `/auth/register` - User registration
- **POST** `/auth/login` - User login
- **GET** `/stations/nearby?lat=...&lng=...` - Find nearby stations
- **POST** `/vehicles/scan` - Scan QR code
- **POST** `/rides/start` - Start a ride
- **POST** `/rides/end` - End ride & calculate fare
- **GET** `/rides/history` - Get ride history
- **POST** `/wallet/add` - Add money to wallet
- **POST** `/passes/buy` - Buy monthly/weekly pass

**Full API documentation**: See `API_DOCS.md`

## 🎮 Testing the API

### Sample Test Flow:
1. **Register**: Create a new customer account
2. **Login**: Get authentication token
3. **Find Stations**: Search nearby parking stations
4. **View Vehicles**: Check available vehicles at a station
5. **Start Ride**: Begin a ride by scanning QR
6. **End Ride**: Complete ride with fare calculation
7. **Check History**: View completed rides

### Test Script:
```bash
node test-api.js
```

## 🌐 Frontend Integration

### Authentication Headers:
```javascript
headers: {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}
```

### Sample Frontend Calls:
```javascript
// Register user
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_name: 'John Doe',
    email: 'john@example.com',
    mobile: '9876543210',
    password: 'password123',
    license_number: 'DL1234567890'
  })
});

// Get nearby stations
const stations = await fetch('/api/stations/nearby?lat=28.6139&lng=77.2090', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

## 🔧 Configuration

### Environment Variables (.env):
```
MONGODB_URI=mongodb://localhost:27017/bolt-ride-customer
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

## 🚀 Production Deployment

### Before going live:
1. **Change JWT_SECRET** to a strong, unique key
2. **Set up MongoDB Atlas** for cloud database
3. **Add input validation** and rate limiting
4. **Set up proper logging** and monitoring
5. **Add HTTPS** and security headers
6. **Configure CORS** for your frontend domain

## 🎉 Next Steps

### Frontend Integration:
1. Connect React app to these APIs
2. Implement QR scanner using camera
3. Add Google Maps for station locations
4. Create geofencing with real-time tracking
5. Add payment gateway integration

### Advanced Features:
1. Push notifications for alerts
2. Real-time vehicle tracking
3. Admin dashboard integration
4. Analytics and reporting
5. Multi-language support

## 📞 Support

Your complete Bolt Ride Customer backend is ready! 🎉

The backend provides all the endpoints needed for:
- User management
- Ride booking & tracking
- Payment processing
- Station & vehicle management
- Real-time features

Ready to connect with your React frontend!
