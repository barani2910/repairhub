import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { UserCheck, Check, X, Star, Briefcase, MapPin, DollarSign } from 'lucide-react';

export default function VerifyWorkers() {
  const { token } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (token) {
      loadWorkers();
    }
  }, [token]);

  const loadWorkers = async () => {
    const response = await fetch('/api/admin/workers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (response.ok) {
      setWorkers(data);
    } else {
      console.error('Failed to load workers:', data.message);
    }
  };

  const handleVerify = async (workerId) => {
    const response = await fetch(`/api/admin/approve-worker/${workerId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      loadWorkers();
      alert('Worker verified successfully!');
    } else {
      alert('Error verifying worker');
    }
  };

  const handleReject = async (workerId) => {
    if (!confirm('Are you sure you want to reject this worker?')) return;

    const response = await fetch(`/api/admin/reject-worker/${workerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      loadWorkers();
      alert('Worker rejected');
    } else {
      alert('Error rejecting worker');
    }
  };

  const filteredWorkers =
    filter === 'all'
      ? workers
      : filter === 'verified'
      ? workers.filter(w => w.verified)
      : workers.filter(w => !w.verified);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Verify Workers</h1>
          <p className="text-gray-600 mt-2">Review and approve worker registrations</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({workers.filter(w => !w.verified).length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'verified'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Verified ({workers.filter(w => w.verified).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({workers.length})
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredWorkers.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl shadow-lg p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No workers found</p>
            </div>
          ) : (
            filteredWorkers.map((worker) => (
              <div key={worker._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        className="w-16 h-16 rounded-full border-2 border-gray-200"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{worker.name}</h3>
                        <p className="text-sm text-gray-600">{worker.email}</p>
                      </div>
                    </div>
                    {worker.verified && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                        <Check className="w-4 h-4" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {worker.profession && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 mr-2" />
                        <span>{worker.profession}</span>
                      </div>
                    )}
                    {worker.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{worker.location}</span>
                      </div>
                    )}
                    {worker.hourlyRate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>${worker.hourlyRate}/hr</span>
                      </div>
                    )}
                    {worker.rating && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="w-4 h-4 mr-2 fill-current text-yellow-500" />
                        <span>{worker.rating} ({worker.totalJobs || 0} jobs)</span>
                      </div>
                    )}
                    {worker.experience && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Experience:</span> {worker.experience}
                      </div>
                    )}
                  </div>

                  {worker.skills && worker.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {worker.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!worker.verified && (
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => handleVerify(worker._id)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        <Check className="w-5 h-5" />
                        <span>Verify</span>
                      </button>
                      <button
                        onClick={() => handleReject(worker._id)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        <X className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
