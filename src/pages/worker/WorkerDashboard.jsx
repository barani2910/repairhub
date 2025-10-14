import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Briefcase, DollarSign, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WorkerDashboard() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const calculateEarnings = () => {
    return bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalEarnings: calculateEarnings()
  };

  const recentBookings = bookings
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, 5);

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
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}!</h1>
            <p className="text-gray-600 mt-2">
              {user.verified ? 'Manage your bookings and earnings' : 'Complete your profile to get verified'}
            </p>
          </div>

          {!user.verified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-yellow-800">Profile Verification Pending</h3>
                  <p className="text-yellow-700 mt-1">
                    Your profile is under review by our admin team. You'll be able to receive booking
                    requests once verified.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-block mt-3 text-yellow-800 font-semibold hover:text-yellow-900"
                  >
                    Complete Your Profile →
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <AlertCircle className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-yellow-100 mt-1">Pending Requests</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <Clock className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.active}</p>
              <p className="text-blue-100 mt-1">Active Jobs</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <CheckCircle className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-green-100 mt-1">Completed</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <DollarSign className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">${stats.totalEarnings}</p>
              <p className="text-purple-100 mt-1">Total Earnings</p>
            </div>
          </div>

          {stats.pending > 0 && (
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-8 text-white shadow-xl">
              <h2 className="text-2xl font-bold mb-2">You have {stats.pending} pending requests!</h2>
              <p className="text-yellow-100 mb-6">
                Review and respond to booking requests from customers
              </p>
              <Link
                to="/worker/requests"
                className="inline-flex items-center space-x-2 bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-50 transition shadow-lg"
              >
                <Briefcase className="w-5 h-5" />
                <span>View Requests</span>
              </Link>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/worker/history"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">
                    Work History
                  </h3>
                  <p className="text-gray-600 mt-1">View all your past jobs</p>
                </div>
                <Calendar className="w-10 h-10 text-gray-400 group-hover:text-blue-600 transition" />
              </div>
            </Link>

            <Link
              to="/worker/earnings"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition">
                    Earnings Report
                  </h3>
                  <p className="text-gray-600 mt-1">Track your income</p>
                </div>
                <DollarSign className="w-10 h-10 text-gray-400 group-hover:text-green-600 transition" />
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {recentBookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No bookings yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {user.verified
                      ? 'Bookings will appear here once customers book your services'
                      : 'Complete your profile to start receiving bookings'}
                  </p>
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{booking.description}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(booking.startTime).toLocaleString()}
                        </p>
                        {booking.urgent && (
                          <span className="inline-block mt-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">${booking.amount}</p>
                        <span
                          className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'accepted'
                              ? 'bg-blue-100 text-blue-700'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {booking.status}
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
