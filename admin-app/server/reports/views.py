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

# Collections
rides_collection = db["rides"]
vehicles_collection = db["vehicle_details"]
payments_collection = db["payments"]
charging_ports_collection = db["charging_ports"]
stations_collection = db["stations"]

@csrf_exempt
@require_http_methods(["GET"])
def get_reports(request, station_id):
    """
    Generate comprehensive reports by aggregating data from multiple collections
    """
    try:
        # Get date range (default: last 30 days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Get today's date for daily stats
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)
        
        # Get week start (Monday)
        week_start = today_start - timedelta(days=today_start.weekday())
        
        # Get month start
        month_start = today_start.replace(day=1)

        # === RIDES ANALYTICS ===
        total_rides = rides_collection.count_documents({"station_id": station_id})
        today_rides = rides_collection.count_documents({
            "station_id": station_id,
            "start_time": {"$gte": today_start, "$lt": tomorrow_start}
        })
        week_rides = rides_collection.count_documents({
            "station_id": station_id,
            "start_time": {"$gte": week_start}
        })
        month_rides = rides_collection.count_documents({
            "station_id": station_id,
            "start_time": {"$gte": month_start}
        })

        completed_rides = rides_collection.count_documents({
            "station_id": station_id,
            "status": "completed"
        })
        active_rides = rides_collection.count_documents({
            "station_id": station_id,
            "status": "active"
        })

        # === REVENUE ANALYTICS ===
        total_revenue_pipeline = [
            {"$match": {"station_id": station_id, "status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        total_revenue_result = list(payments_collection.aggregate(total_revenue_pipeline))
        total_revenue = total_revenue_result[0]["total"] if total_revenue_result else 0

        today_revenue_pipeline = [
            {"$match": {
                "station_id": station_id,
                "status": "paid",
                "timestamp": {"$gte": today_start.isoformat(), "$lt": tomorrow_start.isoformat()}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        today_revenue_result = list(payments_collection.aggregate(today_revenue_pipeline))
        today_revenue = today_revenue_result[0]["total"] if today_revenue_result else 0

        # === VEHICLE ANALYTICS ===
        total_vehicles = vehicles_collection.count_documents({"station_id": station_id})
        available_vehicles = vehicles_collection.count_documents({
            "station_id": station_id,
            "status": "available"
        })
        charging_vehicles = vehicles_collection.count_documents({
            "station_id": station_id,
            "status": "charging"
        })
        in_use_vehicles = vehicles_collection.count_documents({
            "station_id": station_id,
            "status": "in_use"
        })

        # Vehicle battery analytics
        battery_pipeline = [
            {"$match": {"station_id": station_id}},
            {"$group": {
                "_id": None,
                "avg_battery": {"$avg": "$battery"},
                "min_battery": {"$min": "$battery"},
                "max_battery": {"$max": "$battery"}
            }}
        ]
        battery_result = list(vehicles_collection.aggregate(battery_pipeline))
        battery_stats = battery_result[0] if battery_result else {
            "avg_battery": 0, "min_battery": 0, "max_battery": 0
        }

        # === CHARGING PORT ANALYTICS ===
        total_ports = charging_ports_collection.count_documents({"station_id": station_id})
        available_ports = charging_ports_collection.count_documents({
            "station_id": station_id,
            "status": "available"
        })
        occupied_ports = charging_ports_collection.count_documents({
            "station_id": station_id,
            "status": "occupied"
        })

        # Port usage analytics
        usage_pipeline = [
            {"$match": {"station_id": station_id}},
            {"$group": {
                "_id": None,
                "total_usage": {"$sum": "$usage_count"},
                "avg_usage": {"$avg": "$usage_count"}
            }}
        ]
        usage_result = list(charging_ports_collection.aggregate(usage_pipeline))
        usage_stats = usage_result[0] if usage_result else {"total_usage": 0, "avg_usage": 0}

        # === DAILY TRENDS (Last 7 days) ===
        daily_trends = []
        for i in range(7):
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            day_rides = rides_collection.count_documents({
                "station_id": station_id,
                "start_time": {"$gte": day_start, "$lt": day_end}
            })
            
            day_revenue_pipeline = [
                {"$match": {
                    "station_id": station_id,
                    "status": "paid",
                    "timestamp": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
                }},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            day_revenue_result = list(payments_collection.aggregate(day_revenue_pipeline))
            day_revenue = day_revenue_result[0]["total"] if day_revenue_result else 0
            
            daily_trends.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "day": day_start.strftime("%A"),
                "rides": day_rides,
                "revenue": day_revenue
            })

        # === PAYMENT METHOD BREAKDOWN ===
        payment_methods_pipeline = [
            {"$match": {"station_id": station_id, "status": "paid"}},
            {"$group": {
                "_id": "$mode",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$amount"}
            }}
        ]
        payment_methods = list(payments_collection.aggregate(payment_methods_pipeline))

        # === POPULAR VEHICLES ===
        popular_vehicles_pipeline = [
            {"$match": {"station_id": station_id}},
            {"$group": {
                "_id": "$vehicle_id",
                "ride_count": {"$sum": 1},
                "total_distance": {"$sum": "$distance_km"},
                "total_duration": {"$sum": "$duration_minutes"}
            }},
            {"$sort": {"ride_count": -1}},
            {"$limit": 5}
        ]
        popular_vehicles = list(rides_collection.aggregate(popular_vehicles_pipeline))

        # === EFFICIENCY METRICS ===
        avg_ride_duration_pipeline = [
            {"$match": {"station_id": station_id, "status": "completed"}},
            {"$group": {
                "_id": None,
                "avg_duration": {"$avg": "$duration_minutes"},
                "avg_distance": {"$avg": "$distance_km"},
                "avg_fare": {"$avg": "$fare"}
            }}
        ]
        efficiency_result = list(rides_collection.aggregate(avg_ride_duration_pipeline))
        efficiency_metrics = efficiency_result[0] if efficiency_result else {
            "avg_duration": 0, "avg_distance": 0, "avg_fare": 0
        }

        # Compile the comprehensive report
        report = {
            "station_id": station_id,
            "generated_at": datetime.now().isoformat(),
            "period": {
                "from": start_date.isoformat(),
                "to": end_date.isoformat()
            },
            
            # Summary Stats
            "summary": {
                "total_rides": total_rides,
                "today_rides": today_rides,
                "week_rides": week_rides,
                "month_rides": month_rides,
                "completed_rides": completed_rides,
                "active_rides": active_rides,
                "completion_rate": round((completed_rides / total_rides * 100) if total_rides > 0 else 0, 2)
            },
            
            # Revenue Analytics
            "revenue": {
                "total_revenue": total_revenue,
                "today_revenue": today_revenue,
                "avg_revenue_per_ride": round((total_revenue / completed_rides) if completed_rides > 0 else 0, 2),
                "payment_methods": payment_methods
            },
            
            # Fleet Analytics
            "fleet": {
                "total_vehicles": total_vehicles,
                "available_vehicles": available_vehicles,
                "charging_vehicles": charging_vehicles,
                "in_use_vehicles": in_use_vehicles,
                "utilization_rate": round((in_use_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0, 2),
                "battery_stats": {
                    "average": round(battery_stats.get("avg_battery", 0), 1),
                    "minimum": battery_stats.get("min_battery", 0),
                    "maximum": battery_stats.get("max_battery", 0)
                }
            },
            
            # Infrastructure Analytics
            "infrastructure": {
                "total_ports": total_ports,
                "available_ports": available_ports,
                "occupied_ports": occupied_ports,
                "port_utilization": round((occupied_ports / total_ports * 100) if total_ports > 0 else 0, 2),
                "total_port_usage": usage_stats.get("total_usage", 0),
                "avg_port_usage": round(usage_stats.get("avg_usage", 0), 1)
            },
            
            # Trends and Performance
            "trends": {
                "daily_trends": list(reversed(daily_trends)),  # Most recent first
                "popular_vehicles": popular_vehicles,
                "efficiency_metrics": {
                    "avg_ride_duration": round(efficiency_metrics.get("avg_duration", 0), 1),
                    "avg_ride_distance": round(efficiency_metrics.get("avg_distance", 0), 2),
                    "avg_fare": round(efficiency_metrics.get("avg_fare", 0), 2)
                }
            }
        }

        return JsonResponse({"status": "success", "report": report})
        
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
