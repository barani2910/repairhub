import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function UserDashboard() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [ratingData, setRatingData] = useState({});

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        setError(err.message);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token, user.id]);

  const handlePayRemaining = async (bookingId) => {
    setSubmittingPayment(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/pay-remaining`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to process payment');
      }
      const result = await response.json();
      // Refresh bookings
      const fetchResponse = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setBookings(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleRateWorker = async (bookingId) => {
    const { rating, feedback } = ratingData[bookingId] || {};
    if (!rating || rating < 1 || rating > 5) {
      alert('Please select a rating between 1 and 5');
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/rate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating: parseInt(rating), feedback: feedback || '' })
      });
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      setRatingData({ ...ratingData, [bookingId]: {} });
      // Refresh bookings
      const fetchResponse = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setBookings(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
      case 'final_price_submitted':
        return 'bg-purple-100 text-purple-700';
      case 'final_payment_done':
        return 'bg-indigo-100 text-indigo-700';
      case 'rated':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'accepted':
        return <Clock className="w-5 h-5" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      case 'final_price_submitted':
        return <Clock className="w-5 h-5" />;
      case 'final_payment_done':
        return <CheckCircle className="w-5 h-5" />;
      case 'rated':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed' || b.status === 'final_price_submitted' || b.status === 'final_payment_done' || b.status === 'rated').length
  };

  return (
    <Layout>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading your bookings...</div>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4">
          Error: {error}
        </div>
      )}
      {!loading && !error && (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user.name}!</h1>
            <p className="text-gray-600 mt-2">Book verified workers for your home services</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <Calendar className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-blue-100 mt-1">Total Bookings</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <AlertCircle className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-yellow-100 mt-1">Pending</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
              <Clock className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.accepted}</p>
              <p className="text-cyan-100 mt-1">Active</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <CheckCircle className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-green-100 mt-1">Completed</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-2">Need a Worker?</h2>
            <p className="text-blue-100 mb-6">
              Find and book verified professionals for your home services
            </p>
            <Link
              to="/user/search"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              <Search className="w-5 h-5" />
              <span>Search Workers</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No bookings yet</p>
                  <p className="text-gray-400 text-sm mt-2">Start by searching for workers</p>
                  <Link
                    to="/user/search"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Search Workers
                  </Link>
                </div>
              ) : (
                bookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-3 md:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {booking.workerName}
                          </h3>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">{booking.profession}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{booking.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{new Date(booking.startTime).toLocaleString()}</span>
                          {booking.urgent && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                              URGENT
                            </span>
                          )}
                        </div>
                        {booking.remainingAmount && booking.remainingAmount > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            Remaining Payment: ${booking.remainingAmount}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-800">
                            ${booking.finalAmount || booking.amount}
                          </span>
                          {booking.advanceAmount && (
                            <p className="text-xs text-gray-500">Advance: ${booking.advanceAmount}</p>
                          )}
                        </div>
                        <span
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </span>
                        {booking.status === 'final_price_submitted' && (
                          <button
                            onClick={() => handlePayRemaining(booking._id)}
                            disabled={submittingPayment}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            {submittingPayment ? 'Processing...' : `Pay $${booking.remainingAmount || 0}`}
                          </button>
                        )}
                        {booking.status === 'final_payment_done' && (
                          <div className="space-y-2 w-full">
                            <select
                              value={ratingData[booking._id]?.rating || ''}
                              onChange={(e) => setRatingData({ ...ratingData, [booking._id]: { ...ratingData[booking._id], rating: e.target.value } })}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Rate the worker</option>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                            <textarea
                              value={ratingData[booking._id]?.feedback || ''}
                              onChange={(e) => setRatingData({ ...ratingData, [booking._id]: { ...ratingData[booking._id], feedback: e.target.value } })}
                              placeholder="Optional feedback..."
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              rows={2}
                            />
                            <button
                              onClick={() => handleRateWorker(booking._id)}
                              disabled={!ratingData[booking._id]?.rating}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                              Submit Rating
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {bookings.length > 5 && (
              <div className="px-6 py-4 border-t border-gray-200 text-center">
                <Link
                  to="/user/history"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View All Bookings
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
