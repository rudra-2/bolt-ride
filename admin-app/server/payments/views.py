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

# Use rides collection instead of payments
ride_collection = db["rides"]  # Changed from payment_collection

# --- Get Payments by Station ID ---
@csrf_exempt
@require_http_methods(["GET"])
def get_payments_by_station(request, station_id):
    try:
        # Convert station_id to int to match database format
        try:
            station_id_int = int(station_id)
        except ValueError:
            station_id_int = station_id
        
        # Get completed rides as payment records - search for both string and int
        payments = list(ride_collection.find(
            {
                "station_id": {"$in": [station_id, station_id_int]}, 
                "status": {"$in": ["completed", "active"]},
                "amount": {"$gt": 0}  # Only rides with amount
            }, 
            {"_id": 0}
        ).sort("end_time", -1))
        
        # Format payments for frontend
        for p in payments:
            # Use ride_id as payment_id
            p["payment_id"] = p.get("ride_id", "N/A")
            p["id"] = p.get("ride_id", "N/A")  # For frontend compatibility
            p["ride_id"] = p.get("ride_id", "N/A")
            p["user_id"] = p.get("customer_id") or p.get("user_id", "N/A")
            p["amount"] = p.get("amount") or p.get("fare", 0)
            # Use payment_status if available, otherwise derive from status
            p["status"] = p.get("payment_status", "pending")
            p["station_id"] = str(p.get("station_id", station_id))  # Ensure string format
            
            # Handle timestamp formatting - use end_time or start_time
            timestamp = p.get("end_time") or p.get("start_time")
            if timestamp:
                if isinstance(timestamp, str):
                    try:
                        # Parse ISO string and convert to datetime object
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        p["timestamp"] = dt.isoformat()
                        p["date"] = dt.strftime("%Y-%m-%d")
                        p["time"] = dt.strftime("%H:%M:%S")
                    except:
                        p["timestamp"] = timestamp
                        p["date"] = "N/A"
                        p["time"] = "N/A"
                elif isinstance(timestamp, datetime):
                    p["timestamp"] = timestamp.isoformat()
                    p["date"] = timestamp.strftime("%Y-%m-%d")
                    p["time"] = timestamp.strftime("%H:%M:%S")
                else:
                    # Handle other timestamp formats
                    p["timestamp"] = str(timestamp)
                    p["date"] = "N/A"
                    p["time"] = "N/A"
            else:
                p["timestamp"] = "N/A"
                p["date"] = "N/A"
                p["time"] = "N/A"
            
            # Add display fields
            p["user_name"] = p.get("user_name", f"User {p['user_id']}")
            p["amount_display"] = f"₹{p['amount']}"
            p["status_display"] = p["status"].title()

        return JsonResponse({"status": "success", "payments": payments})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

# --- Get All Payments ---
@csrf_exempt
@require_http_methods(["GET"])
def get_all_payments(request):
    try:
        # Get all completed rides as payment records
        payments = list(ride_collection.find(
            {
                "status": {"$in": ["completed", "active"]},
                "amount": {"$gt": 0}
            }, 
            {"_id": 0}
        ).sort("end_time", -1))
        
        # Format payments for frontend
        for p in payments:
            p["payment_id"] = p.get("ride_id", "N/A")
            p["id"] = p.get("ride_id", "N/A")
            p["ride_id"] = p.get("ride_id", "N/A")
            p["user_id"] = p.get("customer_id") or p.get("user_id", "N/A")
            p["amount"] = p.get("amount") or p.get("fare", 0)
            # Use payment_status if available, otherwise derive from status
            p["status"] = p.get("payment_status", "pending")
            p["station_id"] = str(p.get("station_id", "N/A"))  # Ensure string format
            
            # Handle timestamp formatting - use end_time or start_time
            timestamp = p.get("end_time") or p.get("start_time")
            if timestamp:
                if isinstance(timestamp, str):
                    try:
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        p["timestamp"] = dt.isoformat()
                        p["date"] = dt.strftime("%Y-%m-%d")
                        p["time"] = dt.strftime("%H:%M:%S")
                    except:
                        p["timestamp"] = timestamp
                        p["date"] = "N/A"
                        p["time"] = "N/A"
                elif isinstance(timestamp, datetime):
                    p["timestamp"] = timestamp.isoformat()
                    p["date"] = timestamp.strftime("%Y-%m-%d")
                    p["time"] = timestamp.strftime("%H:%M:%S")
                else:
                    # Handle other timestamp formats
                    p["timestamp"] = str(timestamp)
                    p["date"] = "N/A"
                    p["time"] = "N/A"
            else:
                p["timestamp"] = "N/A"
                p["date"] = "N/A"
                p["time"] = "N/A"
            
            # Add display fields
            p["user_name"] = p.get("user_name", f"User {p['user_id']}")
            p["amount_display"] = f"₹{p['amount']}"
            p["status_display"] = p["status"].title()

        return JsonResponse({"status": "success", "payments": payments})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
