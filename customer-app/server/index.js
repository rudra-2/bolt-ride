const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boltride')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log('MongoDB connection failed:', err.message);
    console.log('Server running without database - some features may not work');
  });

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Bolt Ride API Documentation'
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/passes', require('./routes/passes'));
app.use('/api/profile', require('./routes/profile'));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Bolt Ride Customer API is working!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
