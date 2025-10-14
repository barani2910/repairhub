import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Users, Search, User, Briefcase, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ManageUsers() {
  const { token } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [usersRes, workersRes, adminsRes] = await Promise.all([
          fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/workers', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/admins', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!usersRes.ok || !workersRes.ok || !adminsRes.ok) {
          throw new Error('Failed to fetch users');
        }

        const users = await usersRes.json();
        const workers = await workersRes.json();
        const admins = await adminsRes.json();

        // Normalize admins to match User structure
        const normalizedAdmins = admins.map(admin => ({
          ...admin,
          role: 'admin',
          verified: true, // Admins are always verified
          _id: admin._id,
          id: admin._id
        }));

        const combined = [...users, ...workers, ...normalizedAdmins];
        setAllUsers(combined);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'worker':
        return 'bg-blue-100 text-blue-700';
      case 'user':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'worker':
        return <Briefcase className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const stats = {
    total: allUsers.length,
    users: allUsers.filter(u => u.role === 'user').length,
    workers: allUsers.filter(u => u.role === 'worker').length,
    admins: allUsers.filter(u => u.role === 'admin').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
          <p className="text-gray-600 mt-2">View and manage all platform users</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-500">Customers</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.users}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-500">Workers</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.workers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-500">Admins</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.admins}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Customers</option>
              <option value="worker">Workers</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Details</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id || user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.avatar || '/default-avatar.png'}
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <span className="font-medium text-gray-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {user.role === 'worker' && user.profession && (
                          <div>{user.profession}</div>
                        )}
                        {user.role === 'worker' && user.hourlyRate && (
                          <div className="text-xs text-gray-500">${user.hourlyRate}/hr</div>
                        )}
                        {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                      </td>
                      <td className="py-4 px-4">
                        {user.role === 'worker' && (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              user.verified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {user.verified ? 'Verified' : 'Pending'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
