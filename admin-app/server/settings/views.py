from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
import json
from datetime import datetime

# MongoDB connection
MONGO_URI = "mongodb+srv://boltride:Boltride%4012@bolt-ride.rqg9ecl.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["boltride"]
settings_collection = db["station_settings"]

@csrf_exempt
@require_http_methods(["GET"])
def get_settings(request, station_id):
    try:
        settings = settings_collection.find_one({"station_id": station_id}, {"_id": 0})
        
        if not settings:
            # Create default settings structure matching your collection
            default_settings = {
                "station_id": station_id,
                "name": f"Station {station_id}",
                "location": "Location not set",
                "capacity": 10,
                "operatingHours": {
                    "open": "06:00",
                    "close": "22:00"
                },
                "pricing": {
                    "baseRate": 8,
                    "perKmRate": 3,
                    "perMinuteRate": 1
                },
                "notifications": {
                    "lowBattery": True,
                    "maintenance": True,
                    "payments": True,
                    "rides": False
                },
                "security": {
                    "requireFaceAuth": True,
                    "autoLock": True,
                    "emergencyContact": "+91 98765 43210"
                },
                "created_at": datetime.now().isoformat()
            }
            
            settings_collection.insert_one(default_settings.copy())
            return JsonResponse({
                "status": "success", 
                "settings": default_settings,
                "message": "Default settings created"
            })
        
        return JsonResponse({"status": "success", "settings": settings})
        
    except Exception as e:
        return JsonResponse({
            "status": "error", 
            "message": f"Database error: {str(e)}"
        }, status=500)

@csrf_exempt
@require_http_methods(["POST", "PUT"])
def update_settings(request, station_id):
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if "name" not in data or not data["name"].strip():
            return JsonResponse({
                "status": "error", 
                "message": "Station name is required"
            }, status=400)
        
        if "capacity" in data:
            if not isinstance(data["capacity"], int) or data["capacity"] <= 0:
                return JsonResponse({
                    "status": "error", 
                    "message": "Capacity must be a positive integer"
                }, status=400)
        
        # Validate operating hours
        if "operatingHours" in data:
            hours = data["operatingHours"]
            if not all(key in hours for key in ["open", "close"]):
                return JsonResponse({
                    "status": "error", 
                    "message": "Operating hours must include open and close times"
                }, status=400)
        
        # Validate pricing structure
        if "pricing" in data:
            pricing = data["pricing"]
            required_pricing_fields = ["baseRate", "perKmRate", "perMinuteRate"]
            for field in required_pricing_fields:
                if field in pricing:
                    if not isinstance(pricing[field], (int, float)) or pricing[field] < 0:
                        return JsonResponse({
                            "status": "error", 
                            "message": f"Pricing {field} must be a non-negative number"
                        }, status=400)
        
        # Validate notifications settings
        if "notifications" in data:
            notifications = data["notifications"]
            notification_keys = ["lowBattery", "maintenance", "payments", "rides"]
            for key in notification_keys:
                if key in notifications and not isinstance(notifications[key], bool):
                    return JsonResponse({
                        "status": "error", 
                        "message": f"Notification {key} must be a boolean value"
                    }, status=400)
        
        # Validate security settings
        if "security" in data:
            security = data["security"]
            boolean_fields = ["requireFaceAuth", "autoLock"]
            for field in boolean_fields:
                if field in security and not isinstance(security[field], bool):
                    return JsonResponse({
                        "status": "error", 
                        "message": f"Security {field} must be a boolean value"
                    }, status=400)
            
            if "emergencyContact" in security:
                contact = security["emergencyContact"]
                if not isinstance(contact, str) or len(contact.strip()) == 0:
                    return JsonResponse({
                        "status": "error", 
                        "message": "Emergency contact must be a valid phone number"
                    }, status=400)
        
        # Add update timestamp
        data["updated_at"] = datetime.now().isoformat()
        
        result = settings_collection.update_one(
            {"station_id": station_id},
            {"$set": data},
            upsert=True
        )
        
        # Return updated settings
        updated_settings = settings_collection.find_one({"station_id": station_id}, {"_id": 0})
        
        return JsonResponse({
            "status": "success", 
            "message": "Settings updated successfully",
            "settings": updated_settings,
            "modified_count": result.modified_count
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            "status": "error", 
            "message": "Invalid JSON format"
        }, status=400)
    except Exception as e:
        return JsonResponse({
            "status": "error", 
            "message": f"Update failed: {str(e)}"
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def reset_settings(request, station_id):
    """Reset settings to default configuration"""
    try:
        default_config = {
            "station_id": station_id,
            "name": f"Station {station_id}",
            "location": "Location not set",
            "capacity": 10,
            "operatingHours": {
                "open": "06:00",
                "close": "22:00"
            },
            "pricing": {
                "baseRate": 8,
                "perKmRate": 3,
                "perMinuteRate": 1
            },
            "notifications": {
                "lowBattery": True,
                "maintenance": True,
                "payments": True,
                "rides": False
            },
            "security": {
                "requireFaceAuth": True,
                "autoLock": True,
                "emergencyContact": "+91 98765 43210"
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        settings_collection.replace_one(
            {"station_id": station_id},
            default_config,
            upsert=True
        )
        
        return JsonResponse({
            "status": "success",
            "message": "Settings reset successfully",
            "settings": default_config
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Reset failed: {str(e)}"
        }, status=500)
