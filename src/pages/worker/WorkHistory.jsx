import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Calendar, CheckCircle, Clock, MapPin, PlayCircle, DollarSign, Star } from 'lucide-react';

export default function WorkHistory() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalPriceData, setFinalPriceData] = useState({});

  useEffect(() => {
    loadBookings();
  }, [token, user.id]);

  const loadBookings = async () => {
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
      const filteredBookings = data.filter(b => b.status === 'accepted' || b.status === 'completed' || b.status === 'final_price_submitted' || b.status === 'final_payment_done' || b.status === 'rated');
      setBookings(filteredBookings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
    } catch (err) {
      setError(err.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWork = async (bookingId) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to complete booking');
      }
      loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFinalPrice = async (bookingId, finalPrice) => {
    if (finalPrice <= 0) {
      alert('Please enter a valid final price');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/submit-final-price`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ finalAmount: parseFloat(finalPrice) })
      });
      if (!response.ok) {
        throw new Error('Failed to submit final price');
      }
      setFinalPriceData({ ...finalPriceData, [bookingId]: '' });
      loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
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
      case 'accepted':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'final_price_submitted':
        return <DollarSign className="w-4 h-4" />;
      case 'final_payment_done':
        return <CheckCircle className="w-4 h-4" />;
      case 'rated':
        return <Star className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const activeJobs = bookings.filter(b => b.status === 'accepted');
  const completedJobs = bookings.filter(b => b.status === 'completed' || b.status === 'final_price_submitted' || b.status === 'final_payment_done' || b.status === 'rated');

  return (
    <Layout>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading work history...</div>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4">
          Error: {error}
        </div>
      )}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Work History</h1>
            <div className="text-sm text-gray-500">
              {activeJobs.length} active | {completedJobs.length} completed
            </div>
          </div>
          <p className="text-gray-600 mt-2">Track your active and completed jobs</p>

          {activeJobs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Active Jobs</h2>
              <div className="space-y-4">
                {activeJobs.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden border-l-4 border-blue-500"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">
                              {booking.description}
                            </h3>
                            {booking.urgent && (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                                URGENT
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>Started: {new Date(booking.startTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{booking.location}</span>
                            </div>
                            {booking.arrivalMessage && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                <p className="text-sm text-blue-800">
                                  Your message: {booking.arrivalMessage}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Estimated</p>
                            <p className="text-2xl font-bold text-gray-800">${booking.amount}</p>
                          </div>
                          <button
                            onClick={() => handleCompleteWork(booking._id)}
                            disabled={submitting}
                            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-5 h-5" />
                            <span>{submitting ? 'Completing...' : 'Mark Complete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Completed Jobs</h2>
            {completedJobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No completed jobs yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Jobs you complete will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedJobs.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {booking.description}
                          </h3>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              <span>Started: {new Date(booking.startTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span>Completed: {new Date(booking.endTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>
                                Duration:{' '}
                                {Math.ceil(
                                  (new Date(booking.endTime) - new Date(booking.startTime)) /
                                    (1000 * 60 * 60)
                                )}{' '}
                                hours
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{booking.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          {booking.status === 'completed' ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                value={finalPriceData[booking._id] || ''}
                                onChange={(e) => setFinalPriceData({ ...finalPriceData, [booking._id]: e.target.value })}
                                placeholder="Enter final price"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                min="0"
                                step="0.01"
                              />
                              <button
                                onClick={() => handleSubmitFinalPrice(booking._id, finalPriceData[booking._id])}
                                disabled={submitting || !finalPriceData[booking._id]}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                              >
                                {submitting ? 'Submitting...' : 'Submit Final Price'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-500">Earned</p>
                              <p className="text-3xl font-bold text-green-600">${booking.finalAmount || booking.amount}</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span className="capitalize ml-1">{booking.status.replace('_', ' ')}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
