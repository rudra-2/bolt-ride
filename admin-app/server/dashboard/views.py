from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- MongoDB Connection ---
MONGO_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGO_URI)
db = client["boltride"]

vehicle_collection = db["vehicle_details"]
ride_collection = db["rides"]
station_collection = db["stations"]
# Remove payment_collection - use ride_collection instead
charging_port_collection = db["charging_ports"]
station_managers_collection = db["station_managers"]

# --- Dashboard Stats API ---
@csrf_exempt
@require_http_methods(["GET"])
def get_dashboard_stats(request, station_id):
    try:
        # Convert station_id to integer for querying
        try:
            station_id_int = int(station_id)
        except ValueError:
            station_id_int = station_id

        # Query with both integer and string station_id
        station_query = {"$or": [{"station_id": station_id_int}, {"station_id": station_id}]}
        
        total_vehicles = vehicle_collection.count_documents(station_query)
        active_rides = ride_collection.count_documents({**station_query, "status": "active"})
        total_rides = ride_collection.count_documents(station_query)

        # Calculate total collection and pending payments
        paid_rides = list(ride_collection.find({**station_query, "payment_status": "paid"}))
        pending_rides = list(ride_collection.find({**station_query, "payment_status": "pending"}))
        
        total_collection = sum([r.get("amount", 0) for r in paid_rides])
        pending_payments = sum([r.get("amount", 0) for r in pending_rides])

        stats = {
            "totalVehicles": total_vehicles,
            "activeRides": active_rides,
            "totalRides": total_rides,
            "totalCollection": total_collection,
            "pendingPayments": pending_payments,
        }
        return JsonResponse({"status": "success", "data": stats})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

# --- Get Active Rides API ---
@csrf_exempt
@require_http_methods(["GET"])
def fetch_active_rides(request, station_id):
    try:
        # Convert station_id to integer for querying
        try:
            station_id_int = int(station_id)
        except ValueError:
            station_id_int = station_id

        # Query with both integer and string station_id
        station_query = {"$or": [{"station_id": station_id_int}, {"station_id": station_id}]}
        
        rides = list(ride_collection.find({**station_query, "status": "active"}, {"_id": 0}))
        ride_list = []
        
        for r in rides:
            ride_data = {
                "ride_id": r.get("ride_id"),
                "id": r.get("ride_id"),
                "user_id": r.get("customer_id") or r.get("user_id"),
                "user": r.get("customer_id") or r.get("user_id"),
                "vehicle_id": r.get("vehicle_id"),
                "vehicle": r.get("vehicle_id"),
                "start_time": r.get("start_time"),
                "startTime": r.get("start_time"),
                "duration_minutes": r.get("duration_minutes", 0),
                "duration": f"{r.get('duration_minutes', 0)} min",
                "status": r.get("status", "active")
            }
            ride_list.append(ride_data)
            
        return JsonResponse({"status": "success", "rides": ride_list})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

# --- Get Vehicles Lite API ---
@csrf_exempt
@require_http_methods(["GET"])
def fetch_vehicles_lite(request, station_id):
    try:
        # Convert station_id to integer for querying
        try:
            station_id_int = int(station_id)
        except ValueError:
            station_id_int = station_id

        # Query with both integer and string station_id, limit to 5 vehicles
        station_query = {"$or": [{"station_id": station_id_int}, {"station_id": station_id}]}
        
        vehicles = list(vehicle_collection.find(station_query, {"_id": 0}).limit(5))
        vehicle_list = []
        
        for v in vehicles:
            vehicle_data = {
                "vehicle_id": v.get("vehicle_id"),
                "id": v.get("vehicle_id"),
                "vehicle_number": v.get("vehicle_number"),
                "number": v.get("vehicle_number"),
                "vehicle_name": v.get("vehicle_name"),
                "type": v.get("type", "Scooter"),
                "model": v.get("model"),
                "battery": v.get("battery_level", v.get("battery", 0)),
                "status": v.get("status", "unknown"),
                "odometer_reading": v.get("odometer_reading", 0),
                "last_service": v.get("last_service")
            }
            vehicle_list.append(vehicle_data)
            
        return JsonResponse({"status": "success", "vehicles": vehicle_list})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

# --- Get Station Details API ---
@csrf_exempt
@require_http_methods(["GET"])
def get_station_details(request, station_id):
    try:
        # Convert station_id to integer for querying
        try:
            station_id_int = int(station_id)
        except ValueError:
            station_id_int = station_id

        # Try both integer and string station_id
        station = station_collection.find_one(
            {"$or": [{"station_id": station_id_int}, {"station_id": station_id}]}, 
            {"_id": 0, "password": 0}
        )
        
        if not station:
            # Create a default station if not found
            station = {
                "station_id": station_id_int,
                "station_name": f"Station {station_id}",
                "name": f"Station {station_id}",
                "location": "Unknown Location",
                "vehicle_capacity": 50,
                "charging_ports": 10,
                "status": "active",
                "coordinates": {"latitude": 0, "longitude": 0}
            }
            print(f"Warning: Station {station_id} not found, using default data")

        # Get charging ports for this station
        charging_ports = list(charging_port_collection.find(
            {"$or": [{"station_id": station_id_int}, {"station_id": station_id}]}, 
            {"_id": 0}
        ))
        
        # Calculate today's stats
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        today_rides = ride_collection.count_documents({
            "$or": [{"station_id": station_id_int}, {"station_id": station_id}],
            "start_time": {"$gte": today, "$lt": tomorrow}
        })
        
        today_revenue_rides = list(ride_collection.find({
            "$or": [{"station_id": station_id_int}, {"station_id": station_id}],
            "start_time": {"$gte": today, "$lt": tomorrow},
            "payment_status": "paid"
        }))
        today_revenue = sum([r.get("amount", 0) for r in today_revenue_rides])

        # Handle different location formats
        location = station.get("location", {})
        if isinstance(location, str):
            location_str = location
            location_data = {
                "address": location_str,
                "city": "Unknown",
                "state": "Unknown", 
                "pincode": "000000"
            }
        else:
            location_data = {
                "address": location.get("address", station.get("location", "Unknown Location")),
                "city": location.get("city", "Unknown"),
                "state": location.get("state", "Unknown"),
                "pincode": location.get("pincode", "000000")
            }

        station_data = {
            "id": station.get("station_id"),
            "station_id": station.get("station_id"),
            "name": station.get("station_name") or station.get("name", f"Station {station_id}"),
            "address": location_data["address"],
            "city": location_data["city"],
            "state": location_data["state"],
            "pincode": location_data["pincode"],
            "geo": station.get("coordinates", {"latitude": 0, "longitude": 0}),
            "capacity": station.get("vehicle_capacity") or station.get("capacity", 50),
            "charging_ports": len(charging_ports) or station.get("charging_ports", 10),
            "status": station.get("status", "active"),
            "ports": charging_ports,
            "today_rides": today_rides,
            "today_revenue": today_revenue,
            "today_active_users": len(set([r.get("customer_id") or r.get("user_id") for r in today_revenue_rides if r.get("customer_id") or r.get("user_id")])),
            "peak_hours": "9 AM - 6 PM",
            "average_distance_km": "8.5",
            "popular_route": "City Center - Mall"
        }
        
        print(f"Station details for {station_id}: {station_data['name']}")
        return JsonResponse({"status": "success", "station": station_data})
        
    except Exception as e:
        print(f"Error in get_station_details: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)