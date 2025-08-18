const mongoose = require('mongoose');
const ParkingStation = require('./models/ParkingStation');
const Vehicle = require('./models/Vehicle');
const Port = require('./models/Port');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bolt-ride-customer');
    
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await ParkingStation.deleteMany({});
    await Vehicle.deleteMany({});
    await Port.deleteMany({});
    
    // Sample parking stations
    const stations = [
      {
        station_id: 1001,
        station_name: "Central Park Station",
        station_area: "Downtown",
        capacity: 20,
        extra_capacity: 5,
        charging_ports: 15,
        coordinates: {
          latitude: 28.6139,
          longitude: 77.2090
        }
      },
      {
        station_id: 1002,
        station_name: "Mall Road Station",
        station_area: "Shopping District",
        capacity: 15,
        extra_capacity: 3,
        charging_ports: 10,
        coordinates: {
          latitude: 28.6169,
          longitude: 77.2120
        }
      },
      {
        station_id: 1003,
        station_name: "Airport Station",
        station_area: "Airport",
        capacity: 30,
        extra_capacity: 8,
        charging_ports: 25,
        coordinates: {
          latitude: 28.5562,
          longitude: 77.1000
        }
      },
      {
        station_id: 1004,
        station_name: "Metro Station Hub",
        station_area: "Transport Hub",
        capacity: 25,
        extra_capacity: 6,
        charging_ports: 20,
        coordinates: {
          latitude: 28.6289,
          longitude: 77.2065
        }
      },
      {
        station_id: 1005,
        station_name: "University Campus",
        station_area: "Education Zone",
        capacity: 18,
        extra_capacity: 4,
        charging_ports: 12,
        coordinates: {
          latitude: 28.6127,
          longitude: 77.2773
        }
      }
    ];
    
    await ParkingStation.insertMany(stations);
    console.log('Parking stations seeded');
    
    // Sample vehicles
    const vehicles = [];
    const vehicleNames = ['Bolt Scooter', 'Thunder Bike', 'Lightning EV', 'Storm Ride', 'Flash Scooter'];
    
    stations.forEach(station => {
      for (let i = 1; i <= 5; i++) {
        vehicles.push({
          vehicle_id: `VH_${station.station_id}_${i}`,
          vehicle_name: vehicleNames[i - 1],
          station_id: station.station_id,
          battery: Math.floor(Math.random() * 80) + 20, // 20-100% battery
          status: 'available',
          qr_code: `QR_${station.station_id}_${i}_${Date.now()}`
        });
      }
    });
    
    await Vehicle.insertMany(vehicles);
    console.log('Vehicles seeded');
    
    // Sample ports
    const ports = [];
    stations.forEach(station => {
      for (let i = 1; i <= station.charging_ports; i++) {
        ports.push({
          port_id: `${station.station_id}_${i}`,
          station_id: station.station_id,
          status: i <= 3 ? 'active' : 'idle' // First 3 ports active, rest idle
        });
      }
    });
    
    await Port.insertMany(ports);
    console.log('Ports seeded');
    
    console.log('Sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
