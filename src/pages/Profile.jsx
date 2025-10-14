import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { User, Mail, Phone, MapPin, CreditCard as Edit2, Save, Briefcase, DollarSign, Star } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profession: user?.profession || '',
    hourlyRate: user?.hourlyRate || '',
    skills: user?.skills?.join(', ') || '',
    experience: user?.experience || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = { ...formData };
    if (user.role === 'worker' && formData.skills) {
      updates.skills = formData.skills.split(',').map(s => s.trim());
    }
    if (formData.hourlyRate) {
      updates.hourlyRate = parseFloat(formData.hourlyRate);
    }
    updateProfile(updates);
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
                <p className="text-blue-100 mt-1 capitalize">{user?.role}</p>
                {user?.role === 'worker' && (
                  <div className="flex items-center justify-center md:justify-start mt-2 space-x-4">
                    {user?.verified && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        Verified
                      </span>
                    )}
                    {user?.rating && (
                      <div className="flex items-center text-white">
                        <Star className="w-5 h-5 fill-current mr-1" />
                        <span>{user.rating}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {user?.role === 'worker' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profession
                        </label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Experience
                        </label>
                        <input
                          type="text"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 5 years"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Skills (comma separated)
                        </label>
                        <input
                          type="text"
                          value={formData.skills}
                          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Plumbing, Repair, Installation"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800 font-medium">{user?.email}</p>
                    </div>
                  </div>

                  {user?.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-800 font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user?.address && (
                    <div className="flex items-start space-x-3 md:col-span-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-800 font-medium">{user.address}</p>
                      </div>
                    </div>
                  )}

                  {user?.role === 'worker' && (
                    <>
                      {user?.profession && (
                        <div className="flex items-start space-x-3">
                          <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Profession</p>
                            <p className="text-gray-800 font-medium">{user.profession}</p>
                          </div>
                        </div>
                      )}

                      {user?.hourlyRate && (
                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Hourly Rate</p>
                            <p className="text-gray-800 font-medium">${user.hourlyRate}/hr</p>
                          </div>
                        </div>
                      )}

                      {user?.experience && (
                        <div className="flex items-start space-x-3">
                          <User className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Experience</p>
                            <p className="text-gray-800 font-medium">{user.experience}</p>
                          </div>
                        </div>
                      )}

                      {user?.skills && user.skills.length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500 mb-2">Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {user.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
