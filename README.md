
# 🚴‍♂️ Bolt Ride - Smart Bike Sharing Platform

A comprehensive bike sharing platform with real-time vehicle management, charging infrastructure, and seamless user experience for both administrators and customers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-4.2+-092E20.svg)](https://djangoproject.com/)

## 🌟 Features

### Admin Dashboard
- **Vehicle Management**: Real-time tracking, battery monitoring, charging status
- **Charging Infrastructure**: Smart charging port management with auto-assignment
- **Financial Analytics**: Payment tracking, revenue reports, station performance
- **Live Updates**: Auto-refreshing vehicle status without page reload
- **Station Management**: Monitor and control multiple charging stations

### Customer App
- **Interactive 3D Models**: Stunning bike visualizations with Three.js
- **QR Code Scanning**: Quick vehicle unlock functionality
- **Real-time Ride Tracking**: Live ride progress and battery status
- **Digital Wallet**: Secure payment processing and ride passes
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🏗️ Architecture

```
bolt-ride/
├── admin-app/                 # Partner/Admin Platform
│   ├── client/               # React Frontend
│   │   ├── src/pages/        # Dashboard, Vehicles, Payments, Reports
│   │   ├── src/api/          # API integration modules
│   │   └── public/           # Static assets
│   └── server/               # Django Backend
│       ├── vehicles/         # Vehicle management APIs
│       ├── charging_ports/   # Charging infrastructure
│       ├── payments/         # Financial operations
│       ├── reports/          # Analytics and reporting
│       └── dashboard/        # Main dashboard APIs
├── customer-app/             # Customer Platform
│   ├── client/               # React Frontend
│   │   ├── src/pages/        # Dashboard, Rides, Wallet, Stations
│   │   ├── src/components/   # Reusable UI components
│   │   └── src/api.js        # API service layer
│   └── server/               # Node.js Backend
│       ├── models/           # MongoDB schemas
│       ├── routes/           # API endpoints
│       ├── controllers/      # Business logic
│       └── services/         # External services
└── docs/                     # Documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.8+)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**
- **pip** (Python package manager)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rudra-2/bolt-ride.git
   cd bolt-ride
   ```

2. **Set up environment variables**
   
   Create `.env` files in both server directories:
   
   **admin-app/server/.env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/boltride
   DEBUG=True
   SECRET_KEY=your-secret-key
   ```
   
   **customer-app/server/.env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/boltride
   PORT=5000
   JWT_SECRET=your-jwt-secret
   ```

### 🔧 Installation & Running

#### Admin App (Django + React)

**Backend:**
```bash
cd admin-app/server
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# Runs on http://localhost:8000
```

**Frontend:**
```bash
cd admin-app/client
npm install
npm start
# Runs on http://localhost:3000
```

#### Customer App (Node.js + React)

**Backend:**
```bash
cd customer-app/server
npm install
npm run seed  # Optional: Seed sample data
npm start
# Runs on http://localhost:5000
```

**Frontend:**
```bash
cd customer-app/client
npm install
npm start
# Runs on http://localhost:3001
```

## 📱 Application Screenshots

### Admin Dashboard
- **Vehicle Management**: Monitor 50+ vehicles across 4 stations
- **Real-time Charging**: Live battery updates and charging status
- **Payment Analytics**: Revenue tracking and financial reports
- **Station Overview**: Comprehensive station performance metrics

### Customer App
- **3D Bike Models**: Interactive vehicle previews
- **Ride Booking**: Seamless QR code scanning and unlock
- **Live Tracking**: Real-time ride progress and navigation
- **Digital Wallet**: Secure payment and pass management

## 🗃️ Database Schema

### Core Collections (MongoDB)

**vehicles:**
- Vehicle tracking, battery status, location
- Real-time charging integration
- Station assignment and availability

**customers:**
- User authentication and profiles
- Wallet balance and transaction history
- Ride preferences and history

**rides:**
- Complete ride lifecycle management
- Payment processing and billing
- Route tracking and analytics

**charging_ports:**
- Port availability and assignment
- Charging session management
- Power consumption tracking

**stations:**
- Station locations and capacity
- Performance metrics and analytics
- Manager assignments and access control

## 🔌 API Documentation

### Admin APIs (Django REST)
- `GET /api/vehicles/{station_id}/` - Get vehicles by station
- `PATCH /api/vehicles/update-status/{vehicle_id}/` - Update vehicle status
- `GET /api/payments/{station_id}/` - Get payment records
- `GET /api/reports/{station_id}/` - Generate station reports
- `POST /api/charging-ports/start-charging/` - Start charging session
- `POST /api/charging-ports/stop-charging/` - Stop charging session

### Customer APIs (Node.js Express)
- `POST /api/auth/login` - User authentication
- `GET /api/stations` - Get available stations
- `POST /api/rides/start` - Start new ride
- `POST /api/rides/end` - End active ride
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/payments/process` - Process payment

## 🔒 Authentication & Security

- **JWT-based authentication** for customer app
- **Session-based authentication** for admin app
- **bcrypt password hashing** for secure storage
- **Input validation** with Joi schemas
- **CORS protection** for cross-origin requests
- **Environment variable protection** for sensitive data

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   - Set production MongoDB URI
   - Configure secure JWT secrets
   - Enable SSL/HTTPS
   - Set up proper CORS policies

2. **Build Applications**
   ```bash
   # Admin frontend
   cd admin-app/client && npm run build
   
   # Customer frontend
   cd customer-app/client && npm run build
   ```

3. **Server Deployment**
   - Deploy Django app with gunicorn/uWSGI
   - Deploy Node.js app with PM2
   - Configure reverse proxy (nginx)
   - Set up SSL certificates

## 📊 Performance Features

- **Auto-refresh functionality** for real-time updates
- **Optimized MongoDB queries** with proper indexing
- **Lazy loading** for 3D models and images
- **Responsive caching** for improved user experience
- **Background charging processes** for seamless operation

## 🛠️ Development Tools

- **ESLint & Prettier** for code formatting
- **Jest** for unit testing
- **React DevTools** for component debugging
- **MongoDB Compass** for database management
- **Postman** collections for API testing

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Rudra Patel** - Project Lead & Full-Stack Developer
- **Smit Patel** - Frontend Developer & UI/UX Designer
- **Dhruvil Patel** - Backend Developer & Database Architect
- **Avinash Patel** - DevOps & Infrastructure Specialist

## 📞 Support

For support, email team@boltride.com or create an issue in this repository.

## 🔮 Future Roadmap

- [ ] Mobile apps for iOS and Android
- [ ] Advanced analytics dashboard
- [ ] Integration with mapping services
- [ ] IoT device integration for real-time tracking
- [ ] AI-powered demand prediction
- [ ] Multi-language support
- [ ] Advanced reporting and business intelligence

---

**Built with ❤️ for sustainable urban mobility**

