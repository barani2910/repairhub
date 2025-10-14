import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { DollarSign, TrendingUp, Calendar, Briefcase } from 'lucide-react';

export default function Earnings() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
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
        const paidBookings = data.filter(b => b.status === 'final_payment_done' || b.status === 'rated');
        setBookings(paidBookings.sort((a, b) => new Date(b.endTime) - new Date(a.endTime)));
      } catch (err) {
        setError(err.message);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [token, user.id]);

  const calculateStats = () => {
    const total = bookings.reduce((sum, b) => sum + (b.finalAmount || b.amount), 0);
    const thisMonth = bookings.filter(b => {
      const date = new Date(b.endTime);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const monthlyEarnings = thisMonth.reduce((sum, b) => sum + (b.finalAmount || b.amount), 0);
    const totalHours = bookings.reduce((sum, b) => {
      const hours = Math.ceil(
        (new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60 * 60)
      );
      return sum + hours;
    }, 0);
    const avgPerJob = bookings.length > 0 ? (total / bookings.length).toFixed(2) : 0;

    return {
      total,
      monthly: monthlyEarnings,
      totalJobs: bookings.length,
      totalHours,
      avgPerJob
    };
  };

  const stats = calculateStats();

  const groupByMonth = () => {
    const grouped = {};
    bookings.forEach(booking => {
      const date = new Date(booking.endTime);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          earnings: 0,
          jobs: 0
        };
      }
      grouped[key].earnings += booking.amount;
      grouped[key].jobs += 1;
    });
    return Object.values(grouped).reverse();
  };

  const monthlyData = groupByMonth();

  return (
    <Layout>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading earnings...</div>
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
            <h1 className="text-3xl font-bold text-gray-800">Earnings Report</h1>
            <p className="text-gray-600 mt-2">Track your income and work statistics</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <DollarSign className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">${stats.total}</p>
              <p className="text-green-100 mt-1">Total Earnings</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <TrendingUp className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">${stats.monthly}</p>
              <p className="text-blue-100 mt-1">This Month</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <Briefcase className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.totalJobs}</p>
              <p className="text-purple-100 mt-1">Total Jobs</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <Calendar className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-3xl font-bold">{stats.totalHours}h</p>
              <p className="text-orange-100 mt-1">Hours Worked</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Key Metrics</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Hourly Rate</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">${user.hourlyRate || 0}/hr</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Average Per Job</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">${stats.avgPerJob}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Average Hours/Job</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.totalJobs > 0 ? (stats.totalHours / stats.totalJobs).toFixed(1) : 0}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Monthly Breakdown</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {monthlyData.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No earnings yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Complete jobs to start earning
                  </p>
                </div>
              ) : (
                monthlyData.map((data, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{data.month}</h3>
                        <p className="text-sm text-gray-600 mt-1">{data.jobs} jobs completed</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">${data.earnings}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Recent Earnings</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No completed jobs</p>
                </div>
              ) : (
                bookings.slice(0, 10).map((booking) => (
                  <div key={booking._id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{booking.description}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(booking.endTime).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          {Math.ceil(
                            (new Date(booking.endTime) - new Date(booking.startTime)) /
                              (1000 * 60 * 60)
                          )}{' '}
                          hours
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">${booking.amount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ${user.hourlyRate || 0}/hr
                        </p>
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
