import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, MapPin, DollarSign, AlertCircle, CreditCard } from 'lucide-react';

export default function BookingForm() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    description: '',
    location: user?.address || '',
    urgent: false,
    advanceAmount: ''
  });

  useEffect(() => {
    const fetchWorker = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/workers/${workerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch worker');
        }
        const workerData = await response.json();
        setWorker(workerData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [token, workerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const estimatedHours = 2;
    const amount = worker.hourlyRate * estimatedHours;

    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workerId: worker._id,
          startTime: startDateTime.toISOString(),
          urgent: formData.urgent,
          amount,
          advanceAmount: parseFloat(formData.advanceAmount) || 0,
          description: formData.description,
          location: formData.location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      navigate('/user');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading worker details...</div>
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

  if (!worker) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Worker not found</p>
        </div>
      </Layout>
    );
  }

  const estimatedCost = worker.hourlyRate * 2;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Book {worker.name}</h1>
            <p className="text-blue-100 mt-2">{worker.profession}</p>
          </div>

          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="w-16 h-16 rounded-full border-2 border-blue-200"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{worker.name}</h3>
                  <p className="text-sm text-gray-600">{worker.profession}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-gray-600">
                      <DollarSign className="w-4 h-4 inline" />
                      ${worker.hourlyRate}/hr
                    </span>
                    {worker.rating && (
                      <span className="text-gray-600">⭐ {worker.rating}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Service Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter service address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the work needed..."
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Advance Payment (Optional)
                </label>
                <input
                  type="number"
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter advance amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pay a portion upfront. Remaining amount will be paid after work completion.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={formData.urgent}
                  onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="urgent" className="flex items-center text-gray-700">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="font-medium">Mark as Urgent</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Worker will be notified immediately)
                  </span>
                </label>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Hourly Rate</span>
                    <span>${worker.hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Duration</span>
                    <span>2 hours</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Total</span>
                    <span>${estimatedCost}</span>
                  </div>
                  {formData.advanceAmount && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Advance Payment</span>
                        <span>-${parseFloat(formData.advanceAmount) || 0}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                          <span>Remaining to Pay</span>
                          <span>${Math.max(0, estimatedCost - (parseFloat(formData.advanceAmount) || 0))}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {!formData.advanceAmount && (
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold text-gray-800">
                        <span>Total to Pay</span>
                        <span>${estimatedCost}</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Final amount will be calculated based on actual work duration. Advance payment is non-refundable.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/user/search')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Creating Booking...' : 'Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
