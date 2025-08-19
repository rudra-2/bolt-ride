from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from datetime import datetime
import json
import os
from dotenv import load_dotenv
import hashlib

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGO_URI)
db = client["boltride"]
station_managers_collection = db["station_managers"]

def hash_password(password):
    """Simple password hashing (in production, use bcrypt or similar)"""
    return hashlib.sha256(password.encode()).hexdigest()

@csrf_exempt
@require_http_methods(["POST"])
def manager_login(request):
    """Station Manager Login"""
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        if not email or not password:
            return JsonResponse({
                "status": "error", 
                "message": "Email and password are required"
            }, status=400)
        
        # Find manager by email
        manager = station_managers_collection.find_one({
            "email": email,
            "status": "active"
        })
        
        if not manager:
            return JsonResponse({
                "status": "error",
                "message": "Invalid email or password"
            }, status=401)
        
        # Verify password (simple check for now, in production use proper hashing)
        if manager.get("password") != password:
            return JsonResponse({
                "status": "error",
                "message": "Invalid email or password"
            }, status=401)
        
        # Update last login
        station_managers_collection.update_one(
            {"_id": manager["_id"]},
            {"$set": {"last_login": datetime.now()}}
        )
        
        # Return manager info (exclude password)
        manager_info = {
            "manager_id": manager.get("manager_id"),
            "station_id": manager.get("station_id"),
            "name": manager.get("name"),
            "email": manager.get("email"),
            "phone": manager.get("phone"),
            "role": manager.get("role"),
            "permissions": manager.get("permissions", {}),
            "last_login": datetime.now().isoformat()
        }
        
        return JsonResponse({
            "status": "success",
            "message": "Login successful",
            "manager": manager_info
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_manager_profile(request, manager_id):
    """Get Manager Profile"""
    try:
        manager = station_managers_collection.find_one(
            {"manager_id": manager_id},
            {"_id": 0, "password": 0}  # Exclude password
        )
        
        if not manager:
            return JsonResponse({
                "status": "error",
                "message": "Manager not found"
            }, status=404)
        
        return JsonResponse({
            "status": "success",
            "manager": manager
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_manager_profile(request, manager_id):
    """Update Manager Profile"""
    try:
        data = json.loads(request.body)
        
        # Fields that can be updated
        allowed_fields = ["name", "email", "phone", "password"]
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                if field == "password" and data[field]:
                    # Hash password before storing (simple hash for demo)
                    update_data[field] = data[field]
                else:
                    update_data[field] = data[field]
        
        if not update_data:
            return JsonResponse({
                "status": "error",
                "message": "No valid fields to update"
            }, status=400)
        
        result = station_managers_collection.update_one(
            {"manager_id": manager_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return JsonResponse({
                "status": "error",
                "message": "Manager not found"
            }, status=404)
        
        return JsonResponse({
            "status": "success",
            "message": "Profile updated successfully"
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_managers_by_station(request, station_id):
    """Get all managers for a station"""
    try:
        managers = list(station_managers_collection.find(
            {"station_id": station_id},
            {"_id": 0, "password": 0}  # Exclude password
        ))
        
        return JsonResponse({
            "status": "success",
            "managers": managers
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def verify_manager_access(request):
    """Verify if manager has access to specific station and functionality"""
    try:
        data = json.loads(request.body)
        manager_id = data.get("manager_id")
        station_id = data.get("station_id")
        permission = data.get("permission")  # e.g., "manage_vehicles", "view_reports"
        
        if not manager_id or not station_id:
            return JsonResponse({
                "status": "error",
                "message": "Manager ID and Station ID are required"
            }, status=400)
        
        manager = station_managers_collection.find_one({
            "manager_id": manager_id,
            "station_id": station_id,
            "status": "active"
        })
        
        if not manager:
            return JsonResponse({
                "status": "error",
                "message": "Access denied",
                "has_access": False
            }, status=403)
        
        # Check specific permission if requested
        has_permission = True
        if permission:
            permissions = manager.get("permissions", {})
            has_permission = permissions.get(permission, False)
        
        return JsonResponse({
            "status": "success",
            "has_access": True,
            "has_permission": has_permission,
            "manager": {
                "name": manager.get("name"),
                "role": manager.get("role"),
                "permissions": manager.get("permissions", {})
            }
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)
