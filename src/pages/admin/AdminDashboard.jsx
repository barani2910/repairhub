import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Users, UserCheck, Calendar, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkers: 0,
    verifiedWorkers: 0,
    pendingWorkers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingLeaves: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [usersRes, workersRes, pendingWorkersRes, bookingsRes, leaveRequestsRes] = await Promise.all([
          fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/workers', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/pending-workers', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/leave-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!usersRes.ok || !workersRes.ok || !pendingWorkersRes.ok || !bookingsRes.ok || !leaveRequestsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [users, workers, pendingWorkers, bookings, leaveRequests] = await Promise.all([
          usersRes.json(),
          workersRes.json(),
          pendingWorkersRes.json(),
          bookingsRes.json(),
          leaveRequestsRes.json()
        ]);

        const verifiedWorkers = workers.filter(w => w.verified).length;
        const totalWorkers = workers.length;
        const pendingWorkersCount = pendingWorkers.length;

        const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const completedBookings = bookings.filter(b => b.status === 'completed').length;
        const totalBookings = bookings.length;
        const totalRevenue = bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + b.amount, 0);

        const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;

        setStats({
          totalUsers: users.length,
          totalWorkers,
          verifiedWorkers,
          pendingWorkers: pendingWorkersCount,
          totalBookings,
          pendingBookings,
          completedBookings,
          totalRevenue,
          pendingLeaves
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4">
          Error: {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage platform operations and oversee all activities</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <Users className="w-10 h-10 mb-3 opacity-90" />
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-blue-100 mt-1">Total Users</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <UserCheck className="w-10 h-10 mb-3 opacity-90" />
            <p className="text-3xl font-bold">{stats.verifiedWorkers}</p>
            <p className="text-purple-100 mt-1">Verified Workers</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <Calendar className="w-10 h-10 mb-3 opacity-90" />
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
            <p className="text-green-100 mt-1">Total Bookings</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <DollarSign className="w-10 h-10 mb-3 opacity-90" />
            <p className="text-3xl font-bold">${stats.totalRevenue}</p>
            <p className="text-orange-100 mt-1">Total Revenue</p>
          </div>
        </div>

        {(stats.pendingWorkers > 0 || stats.pendingLeaves > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800">Action Required</h3>
                <div className="mt-2 space-y-1">
                  {stats.pendingWorkers > 0 && (
                    <p className="text-yellow-700">
                      {stats.pendingWorkers} worker{stats.pendingWorkers > 1 ? 's' : ''} pending verification
                    </p>
                  )}
                  {stats.pendingLeaves > 0 && (
                    <p className="text-yellow-700">
                      {stats.pendingLeaves} leave request{stats.pendingLeaves > 1 ? 's' : ''} pending approval
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Bookings</span>
                <span className="font-bold text-yellow-600">{stats.pendingBookings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed Bookings</span>
                <span className="font-bold text-green-600">{stats.completedBookings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Workers</span>
                <span className="font-bold text-orange-600">{stats.pendingWorkers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Leaves</span>
                <span className="font-bold text-blue-600">{stats.pendingLeaves}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Platform Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Worker Verification Rate</span>
                  <span className="font-semibold text-gray-800">
                    {stats.totalWorkers > 0
                      ? Math.round((stats.verifiedWorkers / stats.totalWorkers) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalWorkers > 0
                          ? (stats.verifiedWorkers / stats.totalWorkers) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Booking Completion Rate</span>
                  <span className="font-semibold text-gray-800">
                    {stats.totalBookings > 0
                      ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalBookings > 0
                          ? (stats.completedBookings / stats.totalBookings) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/admin/verify-workers"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">
                  Verify Workers
                </h3>
                <p className="text-gray-600 mt-1 text-sm">
                  Review and approve worker registrations
                </p>
                {stats.pendingWorkers > 0 && (
                  <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                    {stats.pendingWorkers} Pending
                  </span>
                )}
              </div>
              <UserCheck className="w-10 h-10 text-gray-400 group-hover:text-blue-600 transition" />
            </div>
          </Link>

          <Link
            to="/admin/manage-users"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition">
                  Manage Users
                </h3>
                <p className="text-gray-600 mt-1 text-sm">
                  View and manage all platform users
                </p>
              </div>
              <Users className="w-10 h-10 text-gray-400 group-hover:text-purple-600 transition" />
            </div>
          </Link>

          <Link
            to="/admin/bookings"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition">
                  All Bookings
                </h3>
                <p className="text-gray-600 mt-1 text-sm">
                  View and monitor all bookings
                </p>
              </div>
              <Calendar className="w-10 h-10 text-gray-400 group-hover:text-green-600 transition" />
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
