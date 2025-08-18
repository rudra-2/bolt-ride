import React, { useState, useEffect } from "react";
import { paymentsAPI } from "../api/payments";
import { useParams, useNavigate } from "react-router-dom";

export default function Payments() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError(null);
      
      let data;
      if (stationId) {
        data = await paymentsAPI.getPaymentsByStation(stationId);
      } else {
        data = await paymentsAPI.getAllPayments();
      }
      
      if (data.status === "success") {
        // Convert ISO strings to proper Date objects for sorting
        const paymentsWithDates = data.payments.map(p => ({
          ...p,
          timestamp_date: p.timestamp ? new Date(p.timestamp) : null,
        }));
        setPayments(paymentsWithDates);
      } else {
        setError(data.message || "Failed to fetch payments");
      }
      
      setLoading(false);
    };
    
    loadPayments();
  }, [stationId]);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      (payment.payment_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.ride_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.user_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.mode === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "upi": return "📱";
      case "card": return "💳";
      case "cash": return "💵";
      case "wallet": return "👛";
      default: return "💰";
    }
  };

  // Calculate stats
  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidAmount = filteredPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = filteredPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Payments</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          {stationId && (
            <button 
              onClick={() => navigate(`/dashboard/${stationId}`)} 
              className="text-gray-500 hover:text-gray-800"
            >
              ← Back
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payments Management</h1>
            <p className="text-sm text-gray-500">
              Monitor and track payment transactions {stationId ? `- Station ${stationId}` : "- All Stations"}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">💰</div>
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold">{filteredPayments.length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">✅</div>
            <div>
              <p className="text-sm text-gray-500">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{paidAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">⏳</div>
            <div>
              <p className="text-sm text-gray-500">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">📊</div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Payment ID, Ride ID, User ID..."
            className="flex-1 px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-lg"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading payments...</div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No payments found</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User & Ride
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount & Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.payment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.payment_id}</div>
                          <div className="text-sm text-gray-500">Station: {payment.station_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.user_id}</div>
                          <div className="text-sm text-gray-500">Ride: {payment.ride_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getMethodIcon(payment.mode)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">₹{payment.amount}</div>
                            <div className="text-sm text-gray-500">{payment.mode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{payment.date || "N/A"}</div>
                          <div className="text-gray-500">{payment.time || "N/A"}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
