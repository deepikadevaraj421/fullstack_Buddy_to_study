import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const Groups = () => {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadGroups();
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Healthy') return 'bg-green-100 text-green-700';
    if (status === 'Warning') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold shadow-md">
              + Create Group
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.length > 0 ? (
              groups.map((group) => {
                const latestHealth = group.weeklyHealthHistory?.[group.weeklyHealthHistory.length - 1];
                const status = group.isDissolved ? 'Dissolved' : latestHealth?.status || 'Healthy';
                
                return (
                  <div
                    key={group._id}
                    onClick={() => !group.isDissolved && navigate(`/app/groups/${group._id}`)}
                    className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition ${
                      group.isDissolved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-xl">
                          {group.subject.charAt(0)}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{group.subject} Study Group</h3>
                    <p className="text-gray-600 mb-4">{group.subject}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{group.members.length} members</span>
                    </div>
                    {group.atRiskStreak > 0 && (
                      <p className="text-xs text-red-600 font-medium mt-2">
                        At-Risk: {group.atRiskStreak}/3 weeks
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">No groups yet. Accept an invite to join a group!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;
