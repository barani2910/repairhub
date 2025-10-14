import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Search, Filter, Star, MapPin, DollarSign, Briefcase, CheckCircle } from 'lucide-react';

const PROFESSIONS = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Cleaner', 'Gardener', 'Handyman'];
const LOCATIONS = ['Downtown', 'Suburbs', 'East Side', 'West Side', 'North Side', 'South Side'];

export default function SearchWorkers() {
  const { token } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkers = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let url = '/api/workers';
        const params = new URLSearchParams();
        if (selectedProfession) params.append('profession', selectedProfession);
        if (selectedLocation) params.append('location', selectedLocation);
        if (params.toString()) url += `?${params.toString()}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch workers');
        }
        const data = await response.json();
        setWorkers(data);
        setFilteredWorkers(data);
      } catch (err) {
        setError(err.message);
        setWorkers([]);
        setFilteredWorkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [token, selectedProfession, selectedLocation]);

  useEffect(() => {
    let result = workers;

    if (searchTerm) {
      result = result.filter(
        w =>
          w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.profession?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (minRating > 0) {
      result = result.filter(w => (w.rating || 0) >= minRating);
    }

    setFilteredWorkers(result);
  }, [searchTerm, minRating, workers]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProfession('');
    setSelectedLocation('');
    setMinRating(0);
  };

  return (
    <Layout>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading workers...</div>
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
            <h1 className="text-3xl font-bold text-gray-800">Find Workers</h1>
            <p className="text-gray-600 mt-2">Search and book verified professionals</p>
          </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or profession..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profession
                  </label>
                  <select
                    value={selectedProfession}
                    onChange={(e) => setSelectedProfession(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Professions</option>
                    {PROFESSIONS.map(prof => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Locations</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">Any Rating</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">{filteredWorkers.length}</span> workers found
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((worker) => (
            <div
              key={worker._id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-16 h-16 rounded-full border-2 border-blue-200"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{worker.name}</h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{worker.profession}</span>
                      </div>
                    </div>
                  </div>
                  {worker.verified && (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {worker.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{worker.location}</span>
                    </div>
                  )}

                  {worker.rating && (
                    <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 mr-2 fill-current text-yellow-500" />
                      <span className="font-semibold text-gray-800">{worker.rating}</span>
                      <span className="text-gray-500 ml-1">
                        ({worker.totalJobs || 0} jobs)
                      </span>
                    </div>
                  )}

                  {worker.hourlyRate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="font-semibold text-gray-800">${worker.hourlyRate}</span>
                      <span className="ml-1">per hour</span>
                    </div>
                  )}
                </div>

                {worker.skills && worker.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {worker.skills.slice(0, 3).map((skill, index) => (
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

                <Link
                  to={`/user/book/${worker._id}`}
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredWorkers.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No workers found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      )}
    </Layout>
  );
}
