import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load user:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navbar />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navbar />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-red-600 font-medium">{error || 'Failed to load profile'}</p>
            <button
              onClick={loadUser}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Study Pattern</h2>
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600 mb-1">
                {user.cluster?.label || 'Not assigned'}
              </p>
              <p className="text-sm text-gray-600">
                Confidence: {user.cluster?.confidence || 0}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subjects & Skills</h2>
            {user.subjects && user.subjects.length > 0 ? (
              <div className="space-y-3">
                {user.subjects.map((sub, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{sub.name}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {sub.skill}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No subjects added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
