from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from datetime import datetime, timedelta
import json

# --- MongoDB Connection ---
MONGO_URI = "mongodb+srv://boltride:Boltride%4012@bolt-ride.rqg9ecl.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["boltride"]

vehicle_collection = db["vehicle_details"]
ride_collection = db["rides"]
station_collection = db["stations"]
payment_collection = db["payments"]
charging_port_collection = db["charging_ports"]

# --- Dashboard Stats API ---
@csrf_exempt
@require_http_methods(["GET"])
def get_dashboard_stats(request, station_id):
    try:
        total_vehicles = vehicle_collection.count_documents({"station_id": station_id})
        active_rides = ride_collection.count_documents({"station_id": station_id, "status": "active"})
        total_rides = ride_collection.count_documents({"station_id": station_id})

        # Calculate total collection and pending payments
        paid_rides = list(ride_collection.find({"station_id": station_id, "payment_status": "paid"}))
        pending_rides = list(ride_collection.find({"station_id": station_id, "payment_status": "pending"}))
        
        total_collection = sum([r.get("fare", 0) for r in paid_rides])
        pending_payments = sum([r.get("fare", 0) for r in pending_rides])

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
        rides = list(ride_collection.find({"station_id": station_id, "status": "active"}, {"_id": 0}))
        ride_list = []
        
        for r in rides:
            ride_data = {
                "ride_id": r.get("ride_id"),
                "id": r.get("ride_id"),
                "user_id": r.get("user_id"),
                "user": r.get("user_id"),
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
        vehicles = list(vehicle_collection.find({"station_id": station_id}, {"_id": 0}))
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
                "battery": v.get("battery", 0),
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
        station = station_collection.find_one({"station_id": station_id}, {"_id": 0, "password": 0})
        if not station:
            return JsonResponse({"status": "error", "message": "Station not found"}, status=404)

        # Get charging ports for this station
        charging_ports = list(charging_port_collection.find({"station_id": station_id}, {"_id": 0}))
        
        # Calculate today's stats
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        today_rides = ride_collection.count_documents({
            "station_id": station_id,
            "start_time": {"$gte": today, "$lt": tomorrow}
        })
        
        today_revenue_rides = list(ride_collection.find({
            "station_id": station_id,
            "start_time": {"$gte": today, "$lt": tomorrow},
            "payment_status": "paid"
        }))
        today_revenue = sum([r.get("fare", 0) for r in today_revenue_rides])

        # Flatten location info
        location = station.get("location", {})
        station_data = {
            "id": station.get("station_id"),
            "station_id": station.get("station_id"),
            "name": station.get("name"),
            "address": location.get("address"),
            "city": location.get("city"),
            "state": location.get("state"),
            "pincode": location.get("pincode"),
            "geo": location.get("geo"),
            "capacity": station.get("capacity"),
            "charging_ports": station.get("charging_ports"),
            "status": station.get("status"),
            "ports": charging_ports,
            "today_rides": today_rides,
            "today_revenue": today_revenue,
            "today_active_users": len(set([r.get("user_id") for r in today_revenue_rides])),
            "peak_hours": "9 AM - 6 PM",
            "average_distance_km": "8.5",
            "popular_route": "City Center - Mall"
        }
        return JsonResponse({"status": "success", "station": station_data})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)