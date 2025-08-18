from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from datetime import datetime

# --- MongoDB Connection ---
MONGO_URI = "mongodb+srv://boltride:Boltride%4012@bolt-ride.rqg9ecl.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["boltride"]

payment_collection = db["payments"]
ride_collection = db["rides"]

# --- Get Payments by Station ID ---
@csrf_exempt
@require_http_methods(["GET"])
def get_payments_by_station(request, station_id):
    try:
        payments = list(payment_collection.find(
            {"station_id": station_id}, {"_id": 0}
        ).sort("timestamp", -1))
        
        # Format payments for frontend
        for p in payments:
            # Ensure all required fields are present
            p["payment_id"] = p.get("payment_id", "N/A")
            p["id"] = p.get("payment_id", "N/A")  # For frontend compatibility
            p["ride_id"] = p.get("ride_id", "N/A")
            p["user_id"] = p.get("user_id", "N/A")
            p["amount"] = p.get("amount", 0)
            p["mode"] = p.get("mode", "N/A")
            p["method"] = p.get("mode", "N/A")  # For frontend compatibility
            p["status"] = p.get("status", "pending")
            p["station_id"] = p.get("station_id", station_id)
            
            # Handle timestamp formatting
            if p.get("timestamp"):
                if isinstance(p["timestamp"], str):
                    try:
                        # Parse ISO string and convert to datetime object
                        dt = datetime.fromisoformat(p["timestamp"].replace('Z', '+00:00'))
                        p["timestamp"] = dt.isoformat()
                        p["date"] = dt.strftime("%Y-%m-%d")
                        p["time"] = dt.strftime("%H:%M:%S")
                    except:
                        p["timestamp"] = p["timestamp"]
                        p["date"] = "N/A"
                        p["time"] = "N/A"
                elif isinstance(p["timestamp"], datetime):
                    p["timestamp"] = p["timestamp"].isoformat()
                    p["date"] = p["timestamp"].strftime("%Y-%m-%d")
                    p["time"] = p["timestamp"].strftime("%H:%M:%S")
            else:
                p["timestamp"] = "N/A"
                p["date"] = "N/A"
                p["time"] = "N/A"
            
            # Add display fields
            p["user_name"] = f"User {p['user_id']}"
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
        payments = list(payment_collection.find({}, {"_id": 0}).sort("timestamp", -1))
        
        # Format payments for frontend
        for p in payments:
            p["payment_id"] = p.get("payment_id", "N/A")
            p["id"] = p.get("payment_id", "N/A")
            p["ride_id"] = p.get("ride_id", "N/A")
            p["user_id"] = p.get("user_id", "N/A")
            p["amount"] = p.get("amount", 0)
            p["mode"] = p.get("mode", "N/A")
            p["method"] = p.get("mode", "N/A")
            p["status"] = p.get("status", "pending")
            p["station_id"] = p.get("station_id", "N/A")
            
            # Handle timestamp formatting
            if p.get("timestamp"):
                if isinstance(p["timestamp"], str):
                    try:
                        dt = datetime.fromisoformat(p["timestamp"].replace('Z', '+00:00'))
                        p["timestamp"] = dt.isoformat()
                        p["date"] = dt.strftime("%Y-%m-%d")
                        p["time"] = dt.strftime("%H:%M:%S")
                    except:
                        p["timestamp"] = p["timestamp"]
                        p["date"] = "N/A"
                        p["time"] = "N/A"
                elif isinstance(p["timestamp"], datetime):
                    p["timestamp"] = p["timestamp"].isoformat()
                    p["date"] = p["timestamp"].strftime("%Y-%m-%d")
                    p["time"] = p["timestamp"].strftime("%H:%M:%S")
            else:
                p["timestamp"] = "N/A"
                p["date"] = "N/A"
                p["time"] = "N/A"
            
            p["user_name"] = f"User {p['user_id']}"
            p["amount_display"] = f"₹{p['amount']}"
            p["status_display"] = p["status"].title()

        return JsonResponse({"status": "success", "payments": payments})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
