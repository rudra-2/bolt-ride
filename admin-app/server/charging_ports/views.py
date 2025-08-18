from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from datetime import datetime
import json

MONGO_URI = "mongodb+srv://boltride:Boltride%4012@bolt-ride.rqg9ecl.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["boltride"]
ports_collection = db["charging_ports"]
vehicles_collection = db["vehicle_details"]

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
                    "current_vehicle_id": vehicle_id,
                    "occupied_at": datetime.now(),
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
        
        return JsonResponse({
            "status": "success", 
            "message": f"Vehicle {vehicle_id} assigned to port {port_id}"
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
        
        vehicle_id = port.get("current_vehicle_id")
        
        # Update port status to available
        ports_collection.update_one(
            {"port_id": port_id, "station_id": station_id},
            {
                "$set": {
                    "status": "available",
                    "current_vehicle_id": None
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
            "message": f"Vehicle removed from port {port_id}"
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
            {"_id": 0, "vehicle_id": 1, "vehicle_number": 1, "vehicle_name": 1, "type": 1, "battery": 1}
        ).sort("vehicle_id", 1))
        
        return JsonResponse({"status": "success", "vehicles": vehicles})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
