from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
from bson import ObjectId

# Import charging functions
from charging_ports.views import start_charging_process, stop_charging_process

# Load environment variables
load_dotenv()

# --- MongoDB Connection ---
MONGO_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGO_URI)
db = client["boltride"]

vehicle_collection = db["vehicle_details"]
station_collection = db["stations"]
charging_ports_collection = db["charging_ports"]
station_managers_collection = db["station_managers"]

# Add this test view first
@csrf_exempt
@require_http_methods(["GET"])
def test_connection(request):
    return JsonResponse({
        "status": "success",
        "message": "Django server is running!",
        "timestamp": datetime.now().isoformat()
    })

@csrf_exempt
@require_http_methods(["POST"])
def station_login(request):
    """Deprecated: Use /api/auth/login/ instead"""
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        station_id = data.get("station_id")  # Optional, for backward compatibility

        if not email or not password:
            return JsonResponse({"status": "error", "message": "Email and password are required"})

        # Find manager by email
        query = {"email": email, "status": "active"}
        if station_id:
            query["station_id"] = station_id

        manager = station_managers_collection.find_one(query)
        
        if not manager:
            return JsonResponse({"status": "error", "message": "Invalid email or password"})
        
        # Verify password (simple check for now)
        if manager.get("password") != password:
            return JsonResponse({"status": "error", "message": "Invalid email or password"})
        
        # Update last login
        station_managers_collection.update_one(
            {"_id": manager["_id"]},
            {"$set": {"last_login": datetime.now()}}
        )
        
        return JsonResponse({
            "status": "success", 
            "message": "Login successful",
            "manager": {
                "manager_id": manager.get("manager_id"),
                "station_id": manager.get("station_id"),
                "name": manager.get("name"),
                "role": manager.get("role")
            }
        })
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["GET"])
def fetch_vehicles(request, station_id):
    try:
        # Convert station_id to integer for querying
        try:
            station_id_int = int(station_id)
        except ValueError:
            station_id_int = station_id

        # Query with both integer and string station_id
        station_query = {"$or": [{"station_id": station_id_int}, {"station_id": station_id}]}
        
        # Get vehicles for the station
        vehicles = list(vehicle_collection.find(station_query, {"_id": 0}))
        
        print(f"Found {len(vehicles)} vehicles for station {station_id}")  # Debug log
        
        # Format vehicles and add charging port info
        for vehicle in vehicles:
            # Ensure all required fields are present
            vehicle["vehicle_id"] = vehicle.get("vehicle_id", "N/A")
            vehicle["vehicle_number"] = vehicle.get("vehicle_number", "N/A")
            vehicle["vehicle_name"] = vehicle.get("vehicle_name", "N/A")
            vehicle["type"] = vehicle.get("type", "N/A")
            vehicle["model"] = vehicle.get("model", "N/A")
            vehicle["battery"] = vehicle.get("battery_level", vehicle.get("battery", 0))
            vehicle["battery_level"] = vehicle.get("battery_level", vehicle.get("battery", 0))
            vehicle["status"] = vehicle.get("status", "available")
            vehicle["odometer_reading"] = vehicle.get("odometer_reading", 0)
            vehicle["rental_rate"] = vehicle.get("rental_rate", {"per_km": 0, "per_hour": 0})
            
            # Format dates
            if vehicle.get("last_service"):
                if isinstance(vehicle["last_service"], str):
                    try:
                        dt = datetime.fromisoformat(vehicle["last_service"].replace('Z', '+00:00'))
                        vehicle["last_service_formatted"] = dt.strftime("%Y-%m-%d")
                    except:
                        vehicle["last_service_formatted"] = vehicle["last_service"]
                else:
                    vehicle["last_service_formatted"] = str(vehicle["last_service"])
            else:
                vehicle["last_service_formatted"] = "N/A"
            
            if vehicle.get("added_on"):
                if isinstance(vehicle["added_on"], str):
                    try:
                        dt = datetime.fromisoformat(vehicle["added_on"].replace('Z', '+00:00'))
                        vehicle["added_on_formatted"] = dt.strftime("%Y-%m-%d")
                    except:
                        vehicle["added_on_formatted"] = vehicle["added_on"]
                else:
                    vehicle["added_on_formatted"] = str(vehicle["added_on"])
            else:
                vehicle["added_on_formatted"] = "N/A"
            
            # Check if vehicle is charging and get port info
            vehicle["charging_port_info"] = None
            if vehicle["status"] == "charging":
                charging_port_id = vehicle.get("charging_port_id")
                if charging_port_id:
                    port_info = charging_ports_collection.find_one(
                        {"port_id": charging_port_id, "$or": [{"station_id": station_id_int}, {"station_id": station_id}]},
                        {"_id": 0}
                    )
                    if port_info:
                        # Calculate charging duration
                        charging_started = vehicle.get("charging_started_at")
                        duration_text = "N/A"
                        if charging_started:
                            if isinstance(charging_started, str):
                                try:
                                    charging_started = datetime.fromisoformat(charging_started.replace('Z', '+00:00'))
                                except:
                                    pass
                            if isinstance(charging_started, datetime):
                                duration = datetime.now() - charging_started
                                duration_minutes = int(duration.total_seconds() / 60)
                                hours = duration_minutes // 60
                                minutes = duration_minutes % 60
                                if hours > 0:
                                    duration_text = f"{hours}h {minutes}m"
                                else:
                                    duration_text = f"{minutes}m"
                        
                        vehicle["charging_port_info"] = {
                            "port_id": port_info.get("port_id"),
                            "connector_type": port_info.get("connector_type", "Type2"),
                            "power_rating": port_info.get("power_rating", "22kW"),
                            "charging_duration": duration_text,
                            "charging_started_at": vehicle.get("charging_started_at", "N/A"),
                            "estimated_completion": "Calculating..." if vehicle["battery_level"] < 100 else "Complete"
                        }
        
        # Get station capacity info
        station = station_collection.find_one({"$or": [{"station_id": station_id_int}, {"station_id": station_id}]}, {"_id": 0})
        total_capacity = station.get("vehicle_capacity", 50) if station else 50
        current_count = len(vehicles)
        
        return JsonResponse({
            "status": "success", 
            "vehicles": vehicles,
            "capacity_info": {
                "current_count": current_count,
                "total_capacity": total_capacity,
                "is_full": current_count >= total_capacity,
                "available_slots": max(0, total_capacity - current_count)
            }
        })
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def add_vehicle(request):
    try:
        data = json.loads(request.body)
        
        # Check station capacity first
        station_id = data.get("station_id")
        if not station_id:
            return JsonResponse({"status": "error", "message": "Station ID is required"})
        
        station = station_collection.find_one({"station_id": station_id})
        if not station:
            return JsonResponse({"status": "error", "message": "Station not found"})
        
        current_count = vehicle_collection.count_documents({"station_id": station_id})
        total_capacity = station.get("vehicle_capacity", 50)
        
        if current_count >= total_capacity:
            return JsonResponse({"status": "error", "message": "Station capacity is full"})
        
        # Check if vehicle_id already exists
        existing_vehicle = vehicle_collection.find_one({"vehicle_id": data.get("vehicle_id")})
        if existing_vehicle:
            return JsonResponse({"status": "error", "message": "Vehicle ID already exists"})
        
        # Prepare vehicle data
        vehicle_data = {
            "vehicle_id": data.get("vehicle_id"),
            "station_id": station_id,
            "vehicle_number": data.get("vehicle_number"),
            "vehicle_name": data.get("vehicle_name", ""),
            "type": data.get("type"),
            "model": data.get("model"),
            "battery": int(data.get("battery", 100)),
            "battery_level": int(data.get("battery", 100)),  # For charging compatibility
            "status": data.get("status", "available"),
            "odometer_reading": int(data.get("odometer_reading", 0)),
            "rental_rate": {
                "per_km": float(data.get("rental_rate", {}).get("per_km", 0)),
                "per_hour": float(data.get("rental_rate", {}).get("per_hour", 0))
            },
            "last_service": data.get("last_service", datetime.now().isoformat()),
            "added_on": datetime.now().isoformat()
        }
        
        vehicle_collection.insert_one(vehicle_data)
        return JsonResponse({"status": "success", "message": "Vehicle added successfully"})
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["PUT", "PATCH"])  # Allow both PUT and PATCH
def update_vehicle(request, vehicle_id):
    try:
        data = json.loads(request.body)
        
        # Remove None values and prepare update data
        update_data = {k: v for k, v in data.items() if v is not None and k != "vehicle_id"}
        
        if not update_data:
            return JsonResponse({"status": "error", "message": "No data to update"})
        
        result = vehicle_collection.update_one(
            {"vehicle_id": vehicle_id}, 
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return JsonResponse({"status": "error", "message": "Vehicle not found"})
        
        return JsonResponse({"status": "success", "message": "Vehicle updated successfully"})
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_vehicle(request, vehicle_id):
    try:
        # Check if vehicle is currently charging
        vehicle = vehicle_collection.find_one({"vehicle_id": vehicle_id})
        if not vehicle:
            return JsonResponse({"status": "error", "message": "Vehicle not found"})
        
        if vehicle.get("status") == "charging":
            # Remove from charging port first
            charging_port_id = vehicle.get("charging_port_id")
            if charging_port_id:
                charging_ports_collection.update_one(
                    {"port_id": charging_port_id, "station_id": vehicle["station_id"]},
                    {
                        "$set": {"status": "available", "current_vehicle_id": None},
                        "$unset": {"occupied_at": "", "charging_started_at": ""}
                    }
                )
        
        vehicle_collection.delete_one({"vehicle_id": vehicle_id})
        return JsonResponse({"status": "success", "message": "Vehicle deleted successfully"})
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["GET"])
def get_vehicle_details(request, vehicle_id):
    try:
        vehicle = vehicle_collection.find_one({"vehicle_id": vehicle_id}, {"_id": 0})
        if not vehicle:
            return JsonResponse({"status": "error", "message": "Vehicle not found"})
        
        return JsonResponse({"status": "success", "vehicle": vehicle})
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["GET"])
def get_nearby_stations(request, station_id):
    try:
        # Get all stations except current one
        stations = list(station_collection.find(
            {"station_id": {"$ne": station_id}}, 
            {"_id": 0, "station_id": 1, "name": 1, "location": 1, "capacity": 1}
        ))
        
        # Add current vehicle count for each station
        for station in stations:
            current_count = vehicle_collection.count_documents({"station_id": station["station_id"]})
            station["current_vehicles"] = current_count
            station["available_capacity"] = max(0, station.get("vehicle_capacity", 50) - current_count)
            station["is_full"] = current_count >= station.get("vehicle_capacity", 50)
        
        # Filter only stations with available capacity
        available_stations = [s for s in stations if not s["is_full"]]
        
        return JsonResponse({"status": "success", "stations": available_stations})
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def transfer_vehicle(request):
    try:
        data = json.loads(request.body)
        vehicle_id = data.get("vehicle_id")
        source_station_id = data.get("source_station_id")
        target_station_id = data.get("target_station_id")
        
        if not all([vehicle_id, source_station_id, target_station_id]):
            return JsonResponse({"status": "error", "message": "Missing required fields"})
        
        # Check if vehicle exists and belongs to source station
        vehicle = vehicle_collection.find_one({"vehicle_id": vehicle_id, "station_id": source_station_id})
        if not vehicle:
            return JsonResponse({"status": "error", "message": "Vehicle not found in source station"})
        
        # Check if vehicle is available for transfer
        if vehicle.get("status") in ["in_use", "charging"]:
            return JsonResponse({"status": "error", "message": "Vehicle is currently in use or charging"})
        
        # Check target station capacity
        target_station = station_collection.find_one({"station_id": target_station_id})
        if not target_station:
            return JsonResponse({"status": "error", "message": "Target station not found"})
        
        current_count = vehicle_collection.count_documents({"station_id": target_station_id})
        target_capacity = target_station.get("vehicle_capacity", 50)
        
        if current_count >= target_capacity:
            return JsonResponse({"status": "error", "message": "Target station is at full capacity"})
        
        # Transfer the vehicle
        vehicle_collection.update_one(
            {"vehicle_id": vehicle_id},
            {
                "$set": {
                    "station_id": target_station_id,
                    "transferred_at": datetime.now().isoformat(),
                    "transfer_history": vehicle.get("transfer_history", []) + [{
                        "from_station": source_station_id,
                        "to_station": target_station_id,
                        "transferred_at": datetime.now().isoformat()
                    }]
                }
            }
        )
        
        return JsonResponse({"status": "success", "message": "Vehicle transferred successfully"})
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

# --- Update Vehicle Status ---
@csrf_exempt
@require_http_methods(["PATCH"])
def update_vehicle_status(request, vehicle_id):
    """
    Update the status of a specific vehicle
    """
    try:
        data = json.loads(request.body)
        new_status = data.get("status")
        
        if not new_status:
            return JsonResponse({"status": "error", "message": "Status is required"}, status=400)
        
        # Valid statuses
        valid_statuses = ["available", "charging", "in_use", "maintenance", "out_of_service"]
        if new_status not in valid_statuses:
            return JsonResponse({
                "status": "error", 
                "message": f"Invalid status. Valid options: {', '.join(valid_statuses)}"
            }, status=400)
        
        # Find and update the vehicle
        vehicle = vehicle_collection.find_one({"vehicle_id": vehicle_id})
        if not vehicle:
            return JsonResponse({"status": "error", "message": "Vehicle not found"}, status=404)
        
        # Get vehicle's station_id
        vehicle_station_id = vehicle.get("station_id")
        
        # Prepare update data
        update_data = {
            "status": new_status,
            "updated_at": datetime.now().isoformat()
        }
        
        # Special handling for charging status
        if new_status == "charging":
            # Check if vehicle is already charging
            if vehicle.get("status") == "charging":
                return JsonResponse({
                    "status": "error", 
                    "message": "Vehicle is already charging"
                }, status=400)
            
            # Find an available charging port at the vehicle's station
            charging_port = charging_ports_collection.find_one({
                "station_id": vehicle_station_id,
                "status": "available"
            })
            
            if not charging_port:
                return JsonResponse({
                    "status": "error", 
                    "message": "No charging ports available at this station. Please try again later."
                }, status=400)
            
            # Assign the charging port
            port_id = charging_port.get("port_id")
            update_data["charging_port_id"] = port_id
            update_data["charging_started_at"] = datetime.now().isoformat()
            
            # Mark the port as occupied
            charging_ports_collection.update_one(
                {"port_id": port_id},
                {
                    "$set": {
                        "status": "occupied",
                        "vehicle_id": vehicle_id,
                        "occupied_at": datetime.now().isoformat()
                    },
                    "$inc": {"usage_count": 1}
                }
            )
            
            # Start the automatic charging process
            start_charging_process(vehicle_id, port_id, vehicle_station_id)
            
        # Handle status change from charging to something else
        elif vehicle.get("status") == "charging" and new_status != "charging":
            # Stop the charging process
            stop_charging_process(vehicle_id)
            
            # Free up the charging port
            current_port_id = vehicle.get("charging_port_id")
            if current_port_id:
                charging_ports_collection.update_one(
                    {"port_id": current_port_id},
                    {
                        "$set": {
                            "status": "available",
                            "vehicle_id": None,
                            "occupied_at": None
                        }
                    }
                )
                update_data["charging_port_id"] = None
                update_data["charging_started_at"] = None
        
        # Add any additional data from the request
        if "battery_level" in data:
            update_data["battery_level"] = data["battery_level"]
        if "location" in data:
            update_data["location"] = data["location"]
        if "charging_port_id" in data and new_status != "charging":
            update_data["charging_port_id"] = data["charging_port_id"]
        
        # Update the vehicle in the database
        result = vehicle_collection.update_one(
            {"vehicle_id": vehicle_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return JsonResponse({"status": "error", "message": "Failed to update vehicle status"}, status=500)
        
        # Get the updated vehicle data
        updated_vehicle = vehicle_collection.find_one({"vehicle_id": vehicle_id}, {"_id": 0})
        
        # Prepare response message
        if new_status == "charging" and "charging_port_id" in update_data:
            message = f"Vehicle status updated to {new_status}. Assigned to charging port {update_data['charging_port_id']}. Battery charging will begin automatically."
        else:
            message = f"Vehicle status updated to {new_status}"
        
        return JsonResponse({
            "status": "success", 
            "message": message,
            "vehicle": updated_vehicle
        })
        
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON data"}, status=400)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
