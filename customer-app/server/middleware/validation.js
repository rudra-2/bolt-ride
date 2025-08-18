const Joi = require('joi');

// Validation schemas
const schemas = {
  // Authentication schemas
  register: Joi.object({
    customer_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(), // Indian mobile format
    password: Joi.string().min(6).max(128).required(),
    license_number: Joi.string().min(10).max(20).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Ride schemas
  startRide: Joi.object({
    vehicle_id: Joi.string().required(),
    station_id: Joi.number().integer().positive().required(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    browser_session_id: Joi.string().optional(),
  }),

  endRide: Joi.object({
    ride_id: Joi.string().required(),
    drop_station_id: Joi.number().integer().positive().required(),
    distance: Joi.number().min(0).max(1000).required(),
    total_time: Joi.number().integer().min(1).max(1440).required(), // Max 24 hours
  }),

  // Session schemas
  updateSession: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    distance_increment: Joi.number().min(0).max(10).optional(),
  }),

  // Wallet schemas
  addMoney: Joi.object({
    amount: Joi.number().min(1).max(10000).required(),
  }),

  // Vehicle schemas
  scanQR: Joi.object({
    qr_code: Joi.string().required(),
  }),

  updateBattery: Joi.object({
    battery: Joi.number().min(0).max(100).required(),
  }),

  // Pass schemas
  buyPass: Joi.object({
    pass_type: Joi.string().valid('monthly', 'weekly').required(),
  }),

  // Profile schemas
  updateProfile: Joi.object({
    customer_name: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    license_number: Joi.string().min(10).max(20).optional(),
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).max(128).required(),
  }),

  // Query parameter schemas
  nearbyStations: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }),
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message),
      });
    }
    next();
  };
};

// Query parameter validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        message: 'Query validation error',
        details: error.details.map(detail => detail.message),
      });
    }
    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateQuery,
};
