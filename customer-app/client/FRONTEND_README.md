# Bolt Ride Frontend

A modern React frontend for the Bolt Ride electric vehicle sharing platform.

## Features

### 🏠 Index Page
- Welcome screen with app branding
- Choice between Login and Register
- Feature highlights (find vehicles, charging stations, wallet management)

### 🔐 Authentication Pages
- **Login**: Email and password authentication
- **Register**: Full registration with name, email, phone, and password
- Form validation and error handling
- Automatic redirect to dashboard on success

### 📊 Dashboard
Multi-tab interface with:
- **Home**: Overview with stats, active sessions, and quick actions
- **Stations**: Browse parking stations and available vehicles
- **Wallet**: Manage balance and add funds
- **History**: View past ride history

## Getting Started

### Prerequisites
- Node.js and npm installed
- Backend server running on port 5000

### Installation
```bash
cd customer-app/client
npm install
npm start
```

The app will open at `http://localhost:3000`

## Usage Flow

1. **Landing Page**: Visit `http://localhost:3000`
   - Click "Login" if you have an account
   - Click "Create Account" for new users

2. **Registration/Login**:
   - Fill out the forms with valid information
   - Successful authentication redirects to dashboard

3. **Dashboard**:
   - View your wallet balance and add funds
   - Browse available stations and vehicles
   - Start/end rides (if active session exists)
   - View ride history

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api` with endpoints for:
- Authentication (`/auth/login`, `/auth/register`)
- Stations (`/stations`)
- Vehicles (`/vehicles`)
- Rides (`/rides`)
- Sessions (`/sessions`)
- Wallet (`/wallet`)

## Environment Variables

Create a `.env` file in the client directory:
```
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
```

## Technology Stack

- **React 19.1.1**: Frontend framework
- **React Router**: Navigation and routing
- **Axios**: HTTP client for API calls
- **CSS3**: Modern styling with gradients and animations
- **Local Storage**: Token and user data persistence

## Features Demo

### Authentication
- Register new users with validation
- Login existing users
- JWT token management
- Protected routes

### Dashboard Functionality
- Real-time wallet balance
- Station browsing
- Quick fund addition (₹100, ₹500, ₹1000, ₹2000)
- Ride history display
- Session management

### Responsive Design
- Mobile-friendly layout
- Adaptive grids and flexbox
- Touch-friendly buttons
- Optimized for various screen sizes

## Development Notes

- The app uses modern React hooks (useState, useEffect)
- API calls are handled with try-catch error handling
- Loading states and user feedback are implemented
- Protected routes ensure authentication is required for dashboard access

## Future Enhancements

- Real-time vehicle tracking
- Interactive maps for station locations
- Push notifications for ride updates
- Social features and ride sharing
- Advanced filtering and search
