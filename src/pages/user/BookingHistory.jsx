import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, MapPin } from 'lucide-react';

export default function BookingHistory() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'final_price_submitted':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'final_payment_done':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'rated':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  return (
    <Layout>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading booking history...</div>
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
            <h1 className="text-3xl font-bold text-gray-800">Booking History</h1>
            <p className="text-gray-600 mt-2">View all your past and current bookings</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({bookings.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({bookings.filter(b => b.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'accepted'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({bookings.filter(b => b.status === 'accepted').length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed ({bookings.filter(b => b.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilter('final_price_submitted')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'final_price_submitted'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Final Price Submitted ({bookings.filter(b => b.status === 'final_price_submitted').length})
              </button>
              <button
                onClick={() => setFilter('final_payment_done')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'final_payment_done'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Payment Done ({bookings.filter(b => b.status === 'final_payment_done').length})
              </button>
              <button
                onClick={() => setFilter('rated')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'rated'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rated ({bookings.filter(b => b.status === 'rated').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({bookings.filter(b => b.status === 'rejected').length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No bookings found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {filter === 'all'
                    ? 'You haven\'t made any bookings yet'
                    : `No ${filter} bookings`}
                </p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-800">
                            {booking.workerName}
                          </h3>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{booking.profession}</span>
                          {booking.urgent && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                              URGENT
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 mb-3">{booking.description}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{new Date(booking.startTime).toLocaleString()}</span>
                          </div>

                          {booking.location && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{booking.location}</span>
                            </div>
                          )}

                          {booking.endTime && (
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>
                                Completed at {new Date(booking.endTime).toLocaleString()}
                              </span>
                            </div>
                          )}

                          {booking.arrivalMessage && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                              <p className="text-sm text-blue-800">
                                <span className="font-semibold">Worker message:</span>{' '}
                                {booking.arrivalMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-3">
                        <span
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </span>

                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-800">
                            ${booking.finalAmount || booking.amount}
                          </p>
                          {booking.advanceAmount > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Advance: ${booking.advanceAmount} ({booking.advancePaid ? 'Paid' : 'Pending'})
                            </p>
                          )}
                          {booking.finalAmount && booking.advanceAmount > 0 && (
                            <p className="text-xs text-gray-500">
                              Remaining: ${booking.remainingAmount}
                            </p>
                          )}
                          {booking.status === 'final_payment_done' && (
                            <p className="text-xs text-green-600 font-semibold mt-1">
                              Payment Successful
                            </p>
                          )}
                          {booking.status === 'final_price_submitted' && (
                            <div className="mt-3">
                              <button
                                onClick={() => handlePayRemaining(booking._id)}
                                disabled={submittingPayment}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                              >
                                {submittingPayment ? 'Processing...' : `Pay Remaining $${booking.remainingAmount}`}
                              </button>
                            </div>
                          )}
                          {booking.status === 'final_payment_done' && !booking.rating && (
                            <div className="mt-3 space-y-2">
                              <div className="text-sm font-semibold text-gray-700">Rate Worker</div>
                              <select
                                value={ratingData[booking._id]?.rating || ''}
                                onChange={(e) => setRatingData({
                                  ...ratingData,
                                  [booking._id]: { ...ratingData[booking._id], rating: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">Select Rating</option>
                                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                                <option value="4">⭐⭐⭐⭐ Very Good</option>
                                <option value="3">⭐⭐⭐ Good</option>
                                <option value="2">⭐⭐ Fair</option>
                                <option value="1">⭐ Poor</option>
                              </select>
                              <textarea
                                placeholder="Optional feedback..."
                                value={ratingData[booking._id]?.feedback || ''}
                                onChange={(e) => setRatingData({
                                  ...ratingData,
                                  [booking._id]: { ...ratingData[booking._id], feedback: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                rows="2"
                              />
                              <button
                                onClick={() => handleRateWorker(booking._id)}
                                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                              >
                                Submit Rating
                              </button>
                            </div>
                          )}
                          {booking.rating && (
                            <div className="mt-2 text-xs text-gray-600">
                              Rated: {'⭐'.repeat(booking.rating)}
                              {booking.feedback && (
                                <div className="mt-1 italic">"{booking.feedback}"</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
