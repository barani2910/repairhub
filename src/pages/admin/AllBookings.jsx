import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Calendar, Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function AllBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBookings = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await response.json();
        setBookings(data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
      } catch (err) {
        setError(err.message);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [token]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'accepted':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
    revenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.amount, 0)
  };

  return (
    <Layout>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading bookings...</div>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4">
          Error: {error}
        </div>
      )}
      {!loading && !error && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">All Bookings</h1>
            <p className="text-gray-600 mt-2">Monitor and manage all platform bookings</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.accepted}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">${stats.revenue}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Active</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings found</p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-3 md:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-gray-800">{booking.workerName}</h3>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{booking.profession}</span>
                          {booking.urgent && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">{booking.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>
                            Started: {new Date(booking.startTime).toLocaleString()}
                          </span>
                          {booking.endTime && (
                            <span>
                              Ended: {new Date(booking.endTime).toLocaleString()}
                            </span>
                          )}
                          <span>Booking ID: {booking._id}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="text-xl font-bold text-gray-800">${booking.amount}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            booking.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
