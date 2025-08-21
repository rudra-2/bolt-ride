from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- MongoDB Connection ---
MONGO_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGO_URI)
db = client["boltride"]

rides_collection = db["rides"]

# --- Get Rides by Station ID ---
@csrf_exempt
@require_http_methods(["GET"])
def get_rides_by_station(request, station_id):
    try:
        # Fetch only rides for the given station_id
        rides = list(
            rides_collection.find({"station_id": station_id}, {"_id": 0}).sort("start_time", -1)
        )

        # Format rides for frontend
        for r in rides:
            # Handle datetime objects properly
            if r.get("start_time"):
                if isinstance(r["start_time"], datetime):
                    r["start_time"] = r["start_time"].isoformat()
            
            if r.get("end_time"):
                if isinstance(r["end_time"], datetime):
                    r["end_time"] = r["end_time"].isoformat()

            # Add additional fields for frontend compatibility
            r["user_name"] = r.get("user_name", f"User {r.get('customer_id') or r.get('user_id','N/A')}")
            r["vehicle_number"] = r.get("vehicle_number", r.get("vehicle_id","N/A"))
            r["amount"] = r.get("amount", r.get("fare", 0))
            r["duration"] = r.get("duration", f"{r.get('duration_minutes',0)} min")
            r["distance"] = r.get("distance", f"{r.get('distance_km',0)} km")

            # Safe pickup/drop locations
            pickup = r.get("pickup_location")
            drop = r.get("drop_location")
            r["startLocation"] = f"Lat:{pickup.get('lat', 0)}, Lng:{pickup.get('lng', 0)}" if pickup else "N/A"
            r["endLocation"] = f"Lat:{drop.get('lat', 0)}, Lng:{drop.get('lng', 0)}" if drop else "N/A"

        return JsonResponse({"status": "success", "rides": rides})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
