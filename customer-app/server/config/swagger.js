const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bolt Ride Customer API',
    version: '1.0.0',
    description: 'Complete API for EV Ride Sharing Platform - Customer App',
    contact: {
      name: 'Bolt Ride Team',
      email: 'api@boltride.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
    {
      url: 'https://api.boltride.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Customer: {
        type: 'object',
        properties: {
          customer_id: { type: 'number', example: 1001 },
          customer_name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          mobile: { type: 'string', example: '9876543210' },
          license_number: { type: 'string', example: 'DL1234567890' },
          wallet: { type: 'number', example: 150.50 },
        },
      },
      ParkingStation: {
        type: 'object',
        properties: {
          station_id: { type: 'number', example: 1001 },
          station_name: { type: 'string', example: 'Central Park Station' },
          station_area: { type: 'string', example: 'Downtown' },
          capacity: { type: 'number', example: 20 },
          coordinates: {
            type: 'object',
            properties: {
              latitude: { type: 'number', example: 28.6139 },
              longitude: { type: 'number', example: 77.2090 },
            },
          },
          distance: { type: 'number', example: 2.5 },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          vehicle_id: { type: 'string', example: 'VH_1001_1' },
          vehicle_name: { type: 'string', example: 'Bolt Scooter' },
          station_id: { type: 'number', example: 1001 },
          battery: { type: 'number', example: 85 },
          status: { type: 'string', enum: ['available', 'in_use', 'maintenance', 'charging'] },
          qr_code: { type: 'string', example: 'QR_1001_1_1692374400000' },
        },
      },
      RideHistory: {
        type: 'object',
        properties: {
          ride_id: { type: 'string', example: 'RIDE_1692374400000_1001' },
          customer_id: { type: 'number', example: 1001 },
          vehicle_id: { type: 'string', example: 'VH_1001_1' },
          pickup_station_id: { type: 'number', example: 1001 },
          drop_station_id: { type: 'number', example: 1002 },
          distance: { type: 'number', example: 5.2 },
          total_time: { type: 'number', example: 25 },
          fare_collected: { type: 'number', example: 35.40 },
          status: { type: 'string', enum: ['ongoing', 'completed', 'cancelled'] },
        },
      },
      ActiveRideSession: {
        type: 'object',
        properties: {
          ride_id: { type: 'string', example: 'RIDE_1692374400000_1001' },
          vehicle_id: { type: 'string', example: 'VH_1001_1' },
          elapsed_minutes: { type: 'number', example: 15 },
          total_distance: { type: 'number', example: 3.2 },
          estimated_fare: { type: 'number', example: 26.40 },
          current_location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', example: 28.6150 },
              longitude: { type: 'number', example: 77.2100 },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Error description' },
          error: { type: 'string', example: 'Detailed error message' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
