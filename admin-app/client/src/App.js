import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Vehicles from "./pages/Vehicles";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Rides from "./pages/Rides"; // Assuming you have a Rides component
import ChargingPorts from "./pages/ChargingPorts"; // Assuming you have a ChargingPorts component
import Settings from "./pages/Settings"; // Assuming you have a Settings component
import Reports from "./pages/Reports"; // Assuming you have a Reports component

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Login />} />
        
        {/* Dashboard for a specific station */}
        <Route path="/dashboard/:stationId" element={<Dashboard />} />
        
        {/* Vehicle management for a specific station */}
        <Route path="/vehicles/:stationId" element={<Vehicles />} />
        {/* Payment management */}
        <Route path="/payments/:stationId" element={<Payments />} />
        <Route path="/payments" element={<Payments />} />
        {/* Rides management */}
        <Route path="/rides/:stationId" element={<Rides />} />
        {/* Charging ports management */}
        <Route path="/charging-ports/:stationId" element={<ChargingPorts />} />
        {/* Settings management */}
        <Route path="/settings/:stationId" element={<Settings />} />
        {/* Reports management */}
        <Route path="/reports/:stationId" element={<Reports />} />

      </Routes>
    </Router>
  );
}

export default App;
