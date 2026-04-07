import Navbar from '../components/Navbar';

const AdminDashboard = () => {
  const mockUser = { name: 'Admin User', role: 'admin' };

  const mockUsers = [
    { id: 1, name: 'Alice Johnson', email: 'alice@test.com', status: 'Active' },
    { id: 2, name: 'Bob Smith', email: 'bob@test.com', status: 'Active' },
    { id: 3, name: 'Carol Davis', email: 'carol@test.com', status: 'Inactive' }
  ];

  const mockAtRiskGroups = [
    { id: 1, name: 'DBMS Masters', score: 45, streak: 2 },
    { id: 2, name: 'OS Study Group', score: 38, streak: 3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={mockUser} />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
              <p className="text-4xl font-bold text-gray-900">156</p>
              <p className="text-sm text-green-600 mt-2">↑ 12% from last month</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Groups</h3>
              <p className="text-4xl font-bold text-primary-600">42</p>
              <p className="text-sm text-green-600 mt-2">↑ 8% from last month</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">At Risk Groups</h3>
              <p className="text-4xl font-bold text-red-600">5</p>
              <p className="text-sm text-red-600 mt-2">Needs attention</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* At Risk Groups Table */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">At Risk Groups</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Group Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Health Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">At-Risk Streak</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAtRiskGroups.map((group) => (
                    <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{group.name}</td>
                      <td className="py-3 px-4">
                        <span className="text-red-600 font-semibold">{group.score}/100</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          group.streak >= 3
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {group.streak}/3 weeks
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
