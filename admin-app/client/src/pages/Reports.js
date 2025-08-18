import React, { useState, useEffect } from "react";
import { fetchReports } from "../api/reports";
import { useParams, useNavigate } from "react-router-dom";

export default function Reports() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadReports = async () => {
      if (!stationId) return;

      setLoading(true);
      setError(null);

      const data = await fetchReports(stationId);

      if (data.status === "success") {
        setReport(data.report);
      } else {
        setError(data.message || "Failed to fetch reports");
      }

      setLoading(false);
    };

    loadReports();
  }, [stationId]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md border border-red-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Reports</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 mx-auto">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <div className="text-gray-700 text-xl font-semibold mb-2">Generating Reports</div>
          <div className="text-gray-500">Analyzing data from multiple sources...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">No report data available</div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "📊 Overview", icon: "📊" },
    { id: "revenue", label: "💰 Revenue", icon: "💰" },
    { id: "fleet", label: "🚗 Fleet", icon: "🚗" },
    { id: "performance", label: "📈 Performance", icon: "📈" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/dashboard/${stationId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Analytics & Reports
                </h1>
                <p className="text-gray-600 mt-1">
                  Station {stationId} • Last updated: {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Rides</p>
                    <p className="text-4xl font-bold mt-1">{report.summary.total_rides}</p>
                    <p className="text-blue-200 text-xs mt-2">
                      {report.summary.completion_rate}% completion rate
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">🚗</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-4xl font-bold mt-1">₹{report.revenue.total_revenue.toLocaleString()}</p>
                    <p className="text-green-200 text-xs mt-2">
                      Today: ₹{report.revenue.today_revenue}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Fleet Utilization</p>
                    <p className="text-4xl font-bold mt-1">{report.fleet.utilization_rate}%</p>
                    <p className="text-purple-200 text-xs mt-2">
                      {report.fleet.in_use_vehicles}/{report.fleet.total_vehicles} vehicles active
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">🔋</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Port Utilization</p>
                    <p className="text-4xl font-bold mt-1">{report.infrastructure.port_utilization}%</p>
                    <p className="text-orange-200 text-xs mt-2">
                      {report.infrastructure.occupied_ports}/{report.infrastructure.total_ports} ports occupied
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">📈</span>
                  Today's Performance
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600">{report.summary.today_rides}</div>
                    <div className="text-sm text-gray-600 mt-1">Rides Today</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-3xl font-bold text-green-600">₹{report.revenue.today_revenue}</div>
                    <div className="text-sm text-gray-600 mt-1">Revenue Today</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">🎯</span>
                  Key Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Average Revenue/Ride</span>
                    <span className="font-bold text-green-600">₹{report.revenue.avg_revenue_per_ride}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Fleet Battery Average</span>
                    <span className="font-bold text-blue-600">{report.fleet.battery_stats.average}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === "revenue" && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Revenue Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">💰</span>
                  Revenue Overview
                </h3>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                    <div className="text-4xl font-bold text-green-600">₹{report.revenue.total_revenue.toLocaleString()}</div>
                    <div className="text-gray-600 mt-2">Total Revenue</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">₹{report.revenue.today_revenue}</div>
                      <div className="text-sm text-gray-600">Today</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">₹{report.revenue.avg_revenue_per_ride}</div>
                      <div className="text-sm text-gray-600">Per Ride</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">💳</span>
                  Payment Methods
                </h3>
                <div className="space-y-4">
                  {report.revenue.payment_methods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {method._id === 'UPI' ? '📱' :
                           method._id === 'Card' ? '💳' :
                           method._id === 'Cash' ? '💵' : '👛'}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-800">{method._id}</div>
                          <div className="text-sm text-gray-500">{method.count} transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">₹{method.total_amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          {((method.total_amount / report.revenue.total_revenue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Trends */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">📊</span>
                7-Day Revenue Trends
              </h3>
              <div className="space-y-3">
                {report.trends.daily_trends.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="font-bold text-blue-600">{new Date(day.date).getDate()}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{day.day}</div>
                        <div className="text-sm text-gray-500">{day.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">₹{day.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{day.rides} rides</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fleet Tab */}
        {activeTab === "fleet" && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Fleet Status */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">🚗</span>
                  Fleet Status
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-3xl font-bold text-green-600">{report.fleet.available_vehicles}</div>
                      <div className="text-sm text-gray-600 mt-1">Available</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-600">{report.fleet.charging_vehicles}</div>
                      <div className="text-sm text-gray-600 mt-1">Charging</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600">{report.fleet.in_use_vehicles}</div>
                    <div className="text-sm text-gray-600 mt-1">In Use</div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{report.fleet.utilization_rate}%</div>
                      <div className="text-sm text-gray-600">Utilization Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Battery Analytics */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">🔋</span>
                  Battery Analytics
                </h3>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                    <div className="text-4xl font-bold text-green-600">{report.fleet.battery_stats.average}%</div>
                    <div className="text-gray-600 mt-2">Average Battery Level</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <div className="text-2xl font-bold text-red-600">{report.fleet.battery_stats.minimum}%</div>
                      <div className="text-sm text-gray-600">Minimum</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{report.fleet.battery_stats.maximum}%</div>
                      <div className="text-sm text-gray-600">Maximum</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Vehicles */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">🏆</span>
                Top Performing Vehicles
              </h3>
              <div className="space-y-4">
                {report.trends.popular_vehicles.slice(0, 5).map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{vehicle._id}</div>
                        <div className="text-sm text-gray-500">{vehicle.total_distance} km total</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{vehicle.ride_count}</div>
                      <div className="text-sm text-gray-500">rides</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-8">
            {/* Efficiency Metrics */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">📊</span>
                Efficiency Metrics
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{report.trends.efficiency_metrics.avg_ride_duration}</div>
                  <div className="text-blue-800 font-medium">Minutes</div>
                  <div className="text-sm text-gray-600 mt-1">Average Ride Duration</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-4xl font-bold text-green-600 mb-2">{report.trends.efficiency_metrics.avg_ride_distance}</div>
                  <div className="text-green-800 font-medium">Kilometers</div>
                  <div className="text-sm text-gray-600 mt-1">Average Distance</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-4xl font-bold text-purple-600 mb-2">₹{report.trends.efficiency_metrics.avg_fare}</div>
                  <div className="text-purple-800 font-medium">Rupees</div>
                  <div className="text-sm text-gray-600 mt-1">Average Fare</div>
                </div>
              </div>
            </div>

            {/* Infrastructure Performance */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">⚡</span>
                  Charging Infrastructure
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
                    <span className="text-gray-700 font-medium">Total Ports</span>
                    <span className="font-bold text-orange-600">{report.infrastructure.total_ports}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                    <span className="text-gray-700 font-medium">Available Ports</span>
                    <span className="font-bold text-green-600">{report.infrastructure.available_ports}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                    <span className="text-gray-700 font-medium">Occupied Ports</span>
                    <span className="font-bold text-blue-600">{report.infrastructure.occupied_ports}</span>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600">{report.infrastructure.port_utilization}%</div>
                    <div className="text-sm text-gray-600 mt-1">Utilization Rate</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">📈</span>
                  Performance Summary
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{report.summary.week_rides}</div>
                      <div className="text-sm text-gray-600">This Week</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">{report.summary.month_rides}</div>
                      <div className="text-sm text-gray-600">This Month</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl">
                    <div className="text-3xl font-bold text-indigo-600">{report.summary.completion_rate}%</div>
                    <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600 text-center">
                      Total Usage: {report.infrastructure.total_port_usage} charges
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
