from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from datetime import datetime, timedelta
import json
import os
import time
import threading
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGO_URI)
db = client["boltride"]
ports_collection = db["charging_ports"]
vehicles_collection = db["vehicle_details"]

# Global charging threads management
charging_threads = {}
charging_status = {}

@csrf_exempt
@require_http_methods(["GET"])
def get_ports_by_station(request, station_id):
    try:
        ports = list(ports_collection.find(
            {"station_id": station_id}, {"_id": 0}
        ).sort("port_id", 1))

        # Format ports for frontend
        for p in ports:
            p["port_id"] = p.get("port_id", "N/A")
            p["id"] = p.get("port_id", "N/A")
            p["current_vehicle_id"] = p.get("current_vehicle_id", None)
            p["current_vehicle"] = p.get("current_vehicle_id", "None")
            p["status"] = p.get("status", "unknown")
            p["connector_type"] = p.get("connector_type", "Type2")
            p["max_power_kw"] = p.get("max_power_kw", 0)
            p["usage_count"] = p.get("usage_count", 0)
            p["last_service"] = p.get("last_service", "N/A")
            
            if p.get("created_at"):
                if isinstance(p["created_at"], datetime):
                    p["created_at"] = p["created_at"].isoformat()
                elif isinstance(p["created_at"], str):
                    p["created_at"] = p["created_at"]
            else:
                p["created_at"] = "N/A"
            
            p["name"] = f"Port {p['port_id']}"
            p["power_display"] = f"{p['max_power_kw']} kW"
            p["status_display"] = p["status"].title()

        return JsonResponse({"status": "success", "ports": ports})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def assign_vehicle_to_port(request, station_id):
    try:
        data = json.loads(request.body)
        port_id = data.get("port_id")
        vehicle_id = data.get("vehicle_id")
        
        if not port_id or not vehicle_id:
            return JsonResponse({"status": "error", "message": "Port ID and Vehicle ID are required"}, status=400)
        
        # Check if port exists and is available
        port = ports_collection.find_one({"port_id": port_id, "station_id": station_id})
        if not port:
            return JsonResponse({"status": "error", "message": "Port not found"}, status=404)
        
        if port.get("status") != "available":
            return JsonResponse({"status": "error", "message": "Port is not available"}, status=400)
        
        # Check if vehicle exists and is available
        vehicle = vehicles_collection.find_one({"vehicle_id": vehicle_id, "station_id": station_id})
        if not vehicle:
            return JsonResponse({"status": "error", "message": "Vehicle not found"}, status=404)
        
        if vehicle.get("status") != "available":
            return JsonResponse({"status": "error", "message": "Vehicle is not available"}, status=400)
        
        # Update port status to occupied and assign vehicle
        ports_collection.update_one(
            {"port_id": port_id, "station_id": station_id},
            {
                "$set": {
                    "status": "occupied",
                    "vehicle_id": vehicle_id,  # Store vehicle_id in charging port
                    "current_vehicle_id": vehicle_id,
                    "occupied_at": datetime.now(),
                    "charging_started_at": datetime.now(),
                    "usage_count": port.get("usage_count", 0) + 1
                }
            }
        )
        
        # Update vehicle status to charging
        vehicles_collection.update_one(
            {"vehicle_id": vehicle_id, "station_id": station_id},
            {
                "$set": {
                    "status": "charging",
                    "charging_port_id": port_id,
                    "charging_started_at": datetime.now()
                }
            }
        )
        
        # Start charging process
        start_charging_process(vehicle_id, port_id, station_id)
        
        return JsonResponse({
            "status": "success", 
            "message": f"Vehicle {vehicle_id} assigned to port {port_id} and charging started"
        })
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def remove_vehicle_from_port(request, station_id):
    try:
        data = json.loads(request.body)
        port_id = data.get("port_id")
        
        if not port_id:
            return JsonResponse({"status": "error", "message": "Port ID is required"}, status=400)
        
        # Get port details
        port = ports_collection.find_one({"port_id": port_id, "station_id": station_id})
        if not port:
            return JsonResponse({"status": "error", "message": "Port not found"}, status=404)
        
        vehicle_id = port.get("current_vehicle_id") or port.get("vehicle_id")
        
        # Stop charging process if active
        if vehicle_id:
            stop_charging_process(vehicle_id)
        
        # Update port status to available
        ports_collection.update_one(
            {"port_id": port_id, "station_id": station_id},
            {
                "$set": {
                    "status": "available",
                    "current_vehicle_id": None,
                    "vehicle_id": None
                },
                "$unset": {
                    "occupied_at": "",
                    "charging_started_at": ""
                }
            }
        )
        
        # Update vehicle status back to available if vehicle exists
        if vehicle_id:
            vehicles_collection.update_one(
                {"vehicle_id": vehicle_id, "station_id": station_id},
                {
                    "$set": {
                        "status": "available"
                    },
                    "$unset": {
                        "charging_port_id": "",
                        "charging_started_at": ""
                    }
                }
            )
        
        return JsonResponse({
            "status": "success", 
            "message": f"Vehicle removed from port {port_id} and charging stopped"
        })
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_available_vehicles(request, station_id):
    try:
        # Get available vehicles for this station
        vehicles = list(vehicles_collection.find(
            {"station_id": station_id, "status": "available"}, 
            {"_id": 0, "vehicle_id": 1, "vehicle_number": 1, "vehicle_name": 1, "type": 1, "battery_level": 1, "model": 1}
        ).sort("vehicle_id", 1))
        
        # Ensure battery_level field exists
        for vehicle in vehicles:
            if "battery_level" not in vehicle:
                vehicle["battery_level"] = vehicle.get("battery", 100)
        
        return JsonResponse({"status": "success", "vehicles": vehicles})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

def start_charging_process(vehicle_id, port_id, station_id):
    """Start charging process for a vehicle"""
    def charging_loop():
        charging_key = f"{vehicle_id}_{port_id}"
        charging_status[charging_key] = True
        
        while charging_status.get(charging_key, False):
            try:
                # Get current vehicle data
                vehicle = vehicles_collection.find_one({"vehicle_id": vehicle_id, "station_id": station_id})
                if not vehicle:
                    break
                
                current_battery = vehicle.get("battery_level", vehicle.get("battery", 0))
                
                # Stop charging if battery reaches 100%
                if current_battery >= 100:
                    charging_status[charging_key] = False
                    break
                
                # Increase battery by 1%
                new_battery = min(100, current_battery + 1)
                
                # Update vehicle battery in database
                vehicles_collection.update_one(
                    {"vehicle_id": vehicle_id, "station_id": station_id},
                    {
                        "$set": {
                            "battery_level": new_battery,
                            "battery": new_battery,  # For compatibility
                            "last_charging_update": datetime.now()
                        }
                    }
                )
                
                print(f"🔋 Vehicle {vehicle_id} battery updated: {current_battery}% → {new_battery}%")
                
                # Wait 10 seconds before next increment
                time.sleep(10)
                
            except Exception as e:
                print(f"❌ Charging error for vehicle {vehicle_id}: {e}")
                break
        
        # Clean up when charging stops
        if charging_key in charging_status:
            del charging_status[charging_key]
        if charging_key in charging_threads:
            del charging_threads[charging_key]
    
    # Start charging thread
    charging_key = f"{vehicle_id}_{port_id}"
    if charging_key not in charging_threads:
        thread = threading.Thread(target=charging_loop, daemon=True)
        charging_threads[charging_key] = thread
        thread.start()
        print(f"🚀 Started charging process for vehicle {vehicle_id} on port {port_id}")

def stop_charging_process(vehicle_id):
    """Stop charging process for a vehicle"""
    # Find and stop all charging processes for this vehicle
    keys_to_remove = []
    for key in charging_status.keys():
        if key.startswith(f"{vehicle_id}_"):
            charging_status[key] = False
            keys_to_remove.append(key)
    
    # Clean up
    for key in keys_to_remove:
        if key in charging_threads:
            del charging_threads[key]
    
    print(f"⏹️ Stopped charging process for vehicle {vehicle_id}")

@csrf_exempt
@require_http_methods(["GET"])
def get_charging_status(request, station_id):
    """Get real-time charging status for all vehicles at a station"""
    try:
        # Get all charging vehicles at this station
        charging_vehicles = list(vehicles_collection.find(
            {"station_id": station_id, "status": "charging"},
            {"_id": 0, "vehicle_id": 1, "vehicle_number": 1, "battery_level": 1, "battery": 1, 
             "charging_port_id": 1, "charging_started_at": 1, "last_charging_update": 1}
        ))
        
        # Format the response
        charging_data = []
        for vehicle in charging_vehicles:
            battery_level = vehicle.get("battery_level", vehicle.get("battery", 0))
            charging_started = vehicle.get("charging_started_at")
            last_update = vehicle.get("last_charging_update")
            
            # Calculate charging duration
            duration_minutes = 0
            if charging_started:
                if isinstance(charging_started, str):
                    charging_started = datetime.fromisoformat(charging_started.replace('Z', '+00:00'))
                duration = datetime.now() - charging_started
                duration_minutes = int(duration.total_seconds() / 60)
            
            charging_data.append({
                "vehicle_id": vehicle["vehicle_id"],
                "vehicle_number": vehicle.get("vehicle_number", "N/A"),
                "battery_level": battery_level,
                "charging_port_id": vehicle.get("charging_port_id"),
                "charging_duration_minutes": duration_minutes,
                "last_update": last_update.isoformat() if last_update else None,
                "is_charging": battery_level < 100
            })
        
        return JsonResponse({
            "status": "success", 
            "charging_vehicles": charging_data,
            "total_charging": len(charging_data)
        })
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def stop_charging(request, station_id):
    """Manually stop charging for a specific vehicle"""
    try:
        data = json.loads(request.body)
        vehicle_id = data.get("vehicle_id")
        
        if not vehicle_id:
            return JsonResponse({"status": "error", "message": "Vehicle ID is required"}, status=400)
        
        # Verify vehicle is charging at this station
        vehicle = vehicles_collection.find_one({"vehicle_id": vehicle_id, "station_id": station_id, "status": "charging"})
        if not vehicle:
            return JsonResponse({"status": "error", "message": "Vehicle not found or not charging"}, status=404)
        
        port_id = vehicle.get("charging_port_id")
        
        # Stop charging process
        stop_charging_process(vehicle_id)
        
        # Update vehicle status
        vehicles_collection.update_one(
            {"vehicle_id": vehicle_id, "station_id": station_id},
            {
                "$set": {
                    "status": "available"
                },
                "$unset": {
                    "charging_port_id": "",
                    "charging_started_at": ""
                }
            }
        )
        
        # Update port status
        if port_id:
            ports_collection.update_one(
                {"port_id": port_id, "station_id": station_id},
                {
                    "$set": {
                        "status": "available",
                        "current_vehicle_id": None,
                        "vehicle_id": None
                    },
                    "$unset": {
                        "occupied_at": "",
                        "charging_started_at": ""
                    }
                }
            )
        
        return JsonResponse({
            "status": "success", 
            "message": f"Charging stopped for vehicle {vehicle_id}"
        })
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
