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
│   ├── Port.js
│   └── ActiveRideSession.js  # NEW: Session persistence
├── routes/           # API route handlers
│   ├── auth.js       # Registration & Login (with Swagger docs)
│   ├── stations.js   # Station & nearby search
│   ├── vehicles.js   # Vehicle management & QR scanning
│   ├── rides.js      # Ride flow & history
│   ├── sessions.js   # NEW: Session management
│   ├── wallet.js     # Wallet management
│   ├── passes.js     # Monthly/weekly passes
│   └── profile.js    # Profile management
├── middleware/
│   ├── auth.js       # JWT authentication middleware
│   └── validation.js # NEW: Joi input validation
├── config/
│   └── swagger.js    # NEW: Swagger/OpenAPI configuration
├── index.js          # Main Express server (with Swagger UI)
├── seedData.js       # Sample data seeder
├── test-api.js       # API testing script
├── test-sessions.js  # NEW: Session management tests
├── test-joi-validation.js  # NEW: Validation testing
├── RideSessionManager.js   # NEW: Frontend session helper
├── .env              # Environment variables
├── API_DOCS.md       # Complete API documentation
├── RIDE_SESSION_DOCS.md    # NEW: Session persistence docs
└── package.json      # Dependencies & scripts
```

## 🎯 Features Implemented

### 🔐 Authentication & Security
- ✅ User registration with auto-generated customer IDs
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Protected routes with middleware
- ✅ **NEW: Input validation with Joi**
- ✅ **NEW: API documentation with Swagger/OpenAPI**

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
- ✅ **NEW: Session persistence across browser refresh/closure**
- ✅ **NEW: Real-time location tracking during rides**

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
- ✅ **NEW: Browser warning before closing during active ride**

### 🛡️ Security Features
- ✅ Theft protection alerts
- ✅ Boundary violation tracking
- ✅ Wallet balance validation
- ✅ Vehicle availability checks
- ✅ **NEW: Session cleanup for inactive rides**
- ✅ **NEW: Data validation and sanitization**

### 🔧 Professional Tools
- ✅ **NEW: Interactive API documentation (Swagger UI)**
- ✅ **NEW: Input validation with Joi**
- ✅ **NEW: Session management system**
- ✅ **NEW: Comprehensive error handling**
- ✅ **NEW: Professional testing scripts**

## 📊 Sample Data Included
- **5 Parking Stations** across different areas in Delhi
- **25 Vehicles** (5 per station) with varying battery levels
- **Charging Ports** for each station
- **Starting Bonus**: ₹100 for new users

---

## 🗃️ MongoDB Schema Documentation

### **1. Customer Collection**
```javascript
{
  customer_id: Number,        // Auto-generated unique ID (starting from 1001)
  customer_name: String,      // Full name (2-50 characters)
  email: String,              // Unique email address
  mobile: String,             // Indian mobile format (6-9 followed by 9 digits)
  password: String,           // Bcrypt hashed password
  license_number: String,     // Driving license number
  wallet: Number,             // Wallet balance in INR (default: 100)
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### **2. ParkingStation Collection**
```javascript
{
  station_id: Number,         // Unique station ID
  station_name: String,       // Station display name
  station_area: String,       // Location area/district
  capacity: Number,           // Total vehicle capacity
  extra_capacity: Number,     // Additional capacity
  charging_ports: Number,     // Number of charging ports
  coordinates: {
    latitude: Number,         // GPS latitude
    longitude: Number         // GPS longitude
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **3. Vehicle Collection**
```javascript
{
  vehicle_id: String,         // Format: "VH_{station_id}_{number}"
  vehicle_name: String,       // Display name (e.g., "Bolt Scooter")
  station_id: Number,         // Current station ID
  battery: Number,            // Battery percentage (0-100)
  status: String,             // "available", "in_use", "maintenance", "charging"
  qr_code: String,            // Unique QR code for scanning
  createdAt: Date,
  updatedAt: Date
}
```

### **4. RideHistory Collection**
```javascript
{
  ride_id: String,            // Format: "RIDE_{timestamp}_{customer_id}"
  customer_id: Number,        // Reference to Customer
  vehicle_id: String,         // Reference to Vehicle
  pickup_station_id: Number,  // Starting station
  drop_station_id: Number,    // Ending station (null if ongoing)
  distance: Number,           // Total distance in KM
  total_time: Number,         // Total time in minutes
  start_date: Date,           // Ride start timestamp
  end_date: Date,             // Ride end timestamp (null if ongoing)
  fare_collected: Number,     // Final fare amount
  status: String,             // "ongoing", "completed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### **5. ActiveRideSession Collection** ⭐ NEW
```javascript
{
  customer_id: Number,        // Reference to Customer (unique)
  ride_id: String,            // Reference to RideHistory
  vehicle_id: String,         // Current vehicle
  session_start_time: Date,   // When session started
  last_ping_time: Date,       // Last activity timestamp
  start_location: {
    latitude: Number,         // Starting GPS coordinates
    longitude: Number
  },
  current_location: {
    latitude: Number,         // Current GPS coordinates
    longitude: Number
  },
  total_distance: Number,     // Accumulated distance
  session_active: Boolean,    // Session status
  browser_session_id: String, // Browser session identifier
  createdAt: Date,
  updatedAt: Date
}
// Auto-expires after 4 hours of inactivity
```

### **6. RidePass Collection**
```javascript
{
  pass_id: String,            // Format: "PASS_{timestamp}_{customer_id}"
  customer_id: Number,        // Reference to Customer
  price_paid: Number,         // Amount paid for pass
  start_date: Date,           // Pass validity start
  end_date: Date,             // Pass validity end
  status: String,             // "active", "expired", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### **7. Port Collection**
```javascript
{
  port_id: String,            // Format: "{station_id}_{port_number}"
  station_id: Number,         // Reference to ParkingStation
  status: String,             // "active", "idle", "broken"
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 Database Relationships

### **Customer → RideHistory**: One-to-Many
- One customer can have multiple rides
- `customer_id` field links the collections

### **Vehicle → RideHistory**: One-to-Many
- One vehicle can have multiple ride records
- `vehicle_id` field links the collections

### **Customer → ActiveRideSession**: One-to-One
- One customer can have only one active session
- Unique constraint on `customer_id`

### **ParkingStation → Vehicle**: One-to-Many
- One station hosts multiple vehicles
- `station_id` field links the collections

### **ParkingStation → Port**: One-to-Many
- One station has multiple charging ports
- `station_id` field links the collections

---

## 📈 Database Indexes for Performance

### **Recommended Indexes:**
```javascript
// Customer collection
{ email: 1 }              // Unique index for login
{ mobile: 1 }             // Unique index for registration
{ customer_id: 1 }        // Unique index for lookups

// Vehicle collection
{ qr_code: 1 }            // Unique index for QR scanning
{ station_id: 1, status: 1 } // Compound index for available vehicles

// RideHistory collection
{ customer_id: 1, start_date: -1 } // Compound index for ride history
{ status: 1 }             // Index for ongoing rides

// ActiveRideSession collection
{ customer_id: 1 }        // Unique index
{ last_ping_time: 1 }     // TTL index for auto-expiry

// ParkingStation collection
{ coordinates: "2dsphere" } // Geospatial index for nearby search
```

---

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
- **GET** `/sessions/check-active` - ⭐ NEW: Check for active rides
- **POST** `/sessions/update-session` - ⭐ NEW: Update ride session

**Full API documentation**: See `API_DOCS.md` or visit `http://localhost:5000/api-docs` ⭐ **NEW: Interactive Swagger UI**

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
node test-api.js           # Test basic API functionality
node test-sessions.js      # ⭐ NEW: Test session persistence
node test-joi-validation.js # ⭐ NEW: Test input validation
```

### **Professional Demo URLs:**
- **Swagger Documentation**: `http://localhost:5000/api-docs` ⭐ **NEW**
- **API Testing**: `http://localhost:5000/api/test`
- **Session Management**: Advanced ride persistence system ⭐ **NEW**

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
// Register user with validation
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_name: 'John Doe',
    email: 'john@example.com',
    mobile: '9876543210',        // ⭐ Validated format
    password: 'password123',      // ⭐ Minimum 6 characters
    license_number: 'DL1234567890'
  })
});

// Get nearby stations
const stations = await fetch('/api/stations/nearby?lat=28.6139&lng=77.2090', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// ⭐ NEW: Check for active rides (session persistence)
const activeRide = await fetch('/api/sessions/check-active', {
  headers: { 'Authorization': 'Bearer ' + token }
});

if (activeRide.has_active_ride) {
  // Redirect to ride page with current data
  window.location.href = `/ride/${activeRide.ride_session.ride_id}`;
}
```

## 🔧 Configuration

### Environment Variables (.env):
```
MONGODB_URI=mongodb://localhost:27017/bolt-ride-customer
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

### **NEW Dependencies Added:**
```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^4.6.3",
  "joi": "^17.9.2"
}
```

## 🚀 Production Deployment

### Before going live:
1. **Change JWT_SECRET** to a strong, unique key
2. **Set up MongoDB Atlas** for cloud database
3. **Add input validation** and rate limiting ✅ **DONE: Joi validation added**
4. **Set up proper logging** and monitoring
5. **Add HTTPS** and security headers
6. **Configure CORS** for your frontend domain
7. **Set up Swagger documentation** ✅ **DONE: Available at /api-docs**
8. **Implement session persistence** ✅ **DONE: Advanced session management**

## 🎉 Next Steps

### Frontend Integration:
1. Connect React app to these APIs
2. Implement QR scanner using camera
3. Add Google Maps for station locations
4. Create geofencing with real-time tracking
5. Add payment gateway integration
6. **⭐ NEW: Integrate RideSessionManager.js for session persistence**
7. **⭐ NEW: Use Swagger documentation for API integration**

### Advanced Features:
1. Push notifications for alerts
2. Real-time vehicle tracking
3. Admin dashboard integration
4. Analytics and reporting
5. Multi-language support
6. **⭐ NEW: Professional API documentation with Swagger**
7. **⭐ NEW: Advanced session management system**
8. **⭐ NEW: Enterprise-grade input validation**

## 📞 Support

Your complete Bolt Ride Customer backend is ready! 🎉

The backend provides all the endpoints needed for:
- User management
- Ride booking & tracking
- Payment processing
- Station & vehicle management
- Real-time features
- **⭐ NEW: Session persistence across browser refresh/closure**
- **⭐ NEW: Professional API documentation with Swagger UI**
- **⭐ NEW: Enterprise-grade input validation**
- **⭐ NEW: Industry-ready development practices**

**🚀 New Professional Features:**
- **Interactive API Documentation**: `http://localhost:5000/api-docs`
- **Input Validation**: Comprehensive Joi validation for all endpoints
- **Session Management**: Never lose an active ride again
- **Testing Scripts**: Professional testing and validation
- **MongoDB Schema**: Complete database documentation

Ready to connect with your React frontend and impress industry professionals! 🎯
