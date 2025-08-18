from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from pymongo import MongoClient
from datetime import datetime

# --- MongoDB Connection ---
MONGO_URI = "mongodb+srv://boltride:Boltride%4012@bolt-ride.rqg9ecl.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["boltride"]

vehicle_collection = db["vehicle_details"]
station_collection = db["stations"]
charging_ports_collection = db["charging_ports"]

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
    try:
        data = json.loads(request.body)
        station_id = data.get("station_id")
        password = data.get("password")

        if not station_id or not password:
            return JsonResponse({"status": "error", "message": "Missing credentials"})

        station = station_collection.find_one({"station_id": station_id, "password": password})
        if station:
            return JsonResponse({"status": "success", "message": "Login successful"})
        else:
            return JsonResponse({"status": "error", "message": "Invalid credentials"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
@require_http_methods(["GET"])
def fetch_vehicles(request, station_id):
    try:
        # Get vehicles for the station
        vehicles = list(vehicle_collection.find({"station_id": station_id}, {"_id": 0}))
        
        # Format vehicles and add charging port info
        for vehicle in vehicles:
            # Ensure all required fields are present
            vehicle["vehicle_id"] = vehicle.get("vehicle_id", "N/A")
            vehicle["vehicle_number"] = vehicle.get("vehicle_number", "N/A")
            vehicle["vehicle_name"] = vehicle.get("vehicle_name", "N/A")
            vehicle["type"] = vehicle.get("type", "N/A")
            vehicle["model"] = vehicle.get("model", "N/A")
            vehicle["battery"] = vehicle.get("battery", 0)
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
                        {"port_id": charging_port_id, "station_id": station_id},
                        {"_id": 0}
                    )
                    if port_info:
                        vehicle["charging_port_info"] = {
                            "port_id": port_info.get("port_id"),
                            "connector_type": port_info.get("connector_type", "Type2"),
                            "max_power_kw": port_info.get("max_power_kw", 0),
                            "charging_started_at": vehicle.get("charging_started_at", "N/A")
                        }
        
        # Get station capacity info
        station = station_collection.find_one({"station_id": station_id}, {"_id": 0})
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
            {"_id": 0, "station_id": 1, "station_name": 1, "location": 1, "vehicle_capacity": 1}
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
