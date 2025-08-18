# Bolt Ride Customer API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
Include JWT token in header: `Authorization: Bearer <token>`

---

## 🔐 Authentication Endpoints

### Register
- **POST** `/auth/register`
- **Body**: `{ customer_name, email, mobile, password, license_number }`
- **Response**: `{ token, customer }`

### Login
- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ token, customer }`

---

## 🏢 Station Endpoints

### Get Nearby Stations
- **GET** `/stations/nearby?lat=28.6139&lng=77.2090`
- **Auth**: Required
- **Response**: `{ stations }` (sorted by distance)

### Get Station Details
- **GET** `/stations/:id`
- **Auth**: Required
- **Response**: `{ station }`

### Get Vehicles at Station
- **GET** `/stations/:id/vehicles`
- **Auth**: Required
- **Response**: `{ vehicles }` (available only)

---

## 🚗 Vehicle Endpoints

### Get Vehicle Details
- **GET** `/vehicles/:id`
- **Auth**: Required
- **Response**: `{ vehicle }`

### Scan QR Code
- **POST** `/vehicles/scan`
- **Auth**: Required
- **Body**: `{ qr_code }`
- **Response**: `{ vehicle }` (if valid)

### Update Battery
- **PUT** `/vehicles/:id/battery`
- **Auth**: Required
- **Body**: `{ battery }`
- **Response**: `{ vehicle }`

---

## 🚴 Ride Endpoints

### Start Ride
- **POST** `/rides/start`
- **Auth**: Required
- **Body**: `{ vehicle_id, station_id }`
- **Response**: `{ ride }`

### End Ride
- **POST** `/rides/end`
- **Auth**: Required
- **Body**: `{ ride_id, drop_station_id, distance, total_time }`
- **Response**: `{ ride }` (with fare calculation)

### Get Ride History
- **GET** `/rides/history`
- **Auth**: Required
- **Response**: `{ rides }`

### Get Ride Details
- **GET** `/rides/:id`
- **Auth**: Required
- **Response**: `{ ride }`

### Send Alert
- **POST** `/rides/alert`
- **Auth**: Required
- **Body**: `{ ride_id, alert_type, coordinates }`
- **Response**: `{ alert_type, timestamp }`

---

## 💰 Wallet Endpoints

### Add Money
- **POST** `/wallet/add`
- **Auth**: Required
- **Body**: `{ amount }`
- **Response**: `{ wallet_balance, amount_added }`

### Get Balance
- **GET** `/wallet/balance`
- **Auth**: Required
- **Response**: `{ wallet_balance }`

---

## 🎫 Pass Endpoints

### Buy Pass
- **POST** `/passes/buy`
- **Auth**: Required
- **Body**: `{ pass_type }` (monthly/weekly)
- **Response**: `{ pass }`

### Get Current Pass
- **GET** `/passes`
- **Auth**: Required
- **Response**: `{ pass }`

### Get Pass History
- **GET** `/passes/history`
- **Auth**: Required
- **Response**: `{ passes }`

---

## 👤 Profile Endpoints

### Get Profile
- **GET** `/profile`
- **Auth**: Required
- **Response**: `{ customer }`

### Update Profile
- **PUT** `/profile`
- **Auth**: Required
- **Body**: `{ customer_name, email, mobile, license_number }`
- **Response**: `{ customer }`

### Change Password
- **PUT** `/profile/password`
- **Auth**: Required
- **Body**: `{ current_password, new_password }`
- **Response**: `{ message }`

---

## 🚀 Getting Started

1. **Start MongoDB** (make sure it's running)
2. **Install dependencies**: `npm install`
3. **Seed sample data**: `npm run seed`
4. **Start server**: `npm run dev`
5. **Test API**: Use Postman or curl to test endpoints

## 📋 Sample Data
- 5 parking stations in different areas
- 25 vehicles (5 per station)
- Charging ports for each station
- Customer registration starts with ₹100 bonus

## 💡 Features Implemented
- ✅ User registration & authentication
- ✅ Nearby station discovery with distance calculation
- ✅ Vehicle availability & QR scanning
- ✅ Complete ride flow (start/end with fare calculation)
- ✅ Wallet management
- ✅ Monthly/weekly passes
- ✅ Ride history
- ✅ Profile management
- ✅ Geofencing alerts
- ✅ Battery simulation
- ✅ Theft protection alerts
