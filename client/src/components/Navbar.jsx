import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const Navbar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const isActive = (path) => location.pathname === path;

  useEffect(() => { if (user) loadNotifications(); }, [user]);

  useEffect(() => {
    const handleNotificationUpdate = () => { if (user) loadNotifications(); };
    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    return () => window.removeEventListener('notificationUpdate', handleNotificationUpdate);
  }, [user]);

  // Click outside to close search
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/users');
        const q = searchQuery.toLowerCase();
        const matched = res.data.filter(u =>
          u.name?.toLowerCase().includes(q) ||
          u.dept?.toLowerCase().includes(q) ||
          u.college?.toLowerCase().includes(q) ||
          u.subjects?.some(s => s.name?.toLowerCase().includes(q))
        ).slice(0, 6);
        setSearchResults(matched);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const unread = res.data.filter(n => !n.read);
      setNotifications(unread);
    } catch (err) { console.error('Failed to load notifications:', err); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const navLinks = [
    { path: '/app', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/app/groups', label: 'Groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { path: '/app/planner', label: 'Planner', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/app/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/app" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-gray-900 text-sm hidden sm:block">Buddy<span className="text-primary-600">Study</span></span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ path, label, icon }) => (
                <Link key={path} to={path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition
                    ${isActive(path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  {label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link to="/app/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition
                    ${isActive('/app/admin') ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  ⚙️ Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right side: Search + Notifs + Profile */}
          <div className="flex items-center gap-2">

            {/* Global Search */}
            <div className="relative" ref={searchRef}>
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition
                ${searchOpen ? 'border-primary-400 bg-white shadow-md w-64' : 'border-gray-200 bg-gray-50 w-36 hover:border-gray-300'}`}>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 w-full"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                )}
              </div>

              {/* Results dropdown */}
              {searchOpen && (searchQuery.trim() || searching) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {searching ? (
                    <div className="p-4 text-sm text-gray-400 text-center">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase px-4 pt-3 pb-1 tracking-wider">Students</p>
                      {searchResults.map(u => (
                        <div key={u._id}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/app'); }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition">
                          <div className="w-9 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center flex-shrink-0">
                            {u.profilePicture
                              ? <img src={u.profilePicture} alt={u.name} className="w-full h-full rounded-full object-cover" />
                              : <span className="text-white font-bold text-sm">{u.name?.charAt(0)}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.dept || u.college || 'Student'}</p>
                          </div>
                          {u.cluster?.label && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">{u.cluster.label}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-400 text-center">No students found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button onClick={() => navigate('/app/notifications')}
              className="relative p-2 rounded-xl hover:bg-gray-50 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{notifications.length > 9 ? '9+' : notifications.length}</span>
                </span>
              )}
            </button>

            {/* Profile */}
            <Link to="/app/profile"
              className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-white shadow-sm">
                {user?.profilePicture
                  ? <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'U'}</span>}
              </div>
              <span className="hidden lg:block text-sm font-semibold text-gray-700">{user?.name?.split(' ')[0] || 'You'}</span>
            </Link>

            <button onClick={handleLogout}
              className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2 space-y-1">
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path} onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition
                  ${isActive(path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                {label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
