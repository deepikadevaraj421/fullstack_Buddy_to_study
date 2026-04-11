import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [formData, setFormData] = useState({
    preferences: { groupSize: 4, mode: 'online', communication: 'both', sessionDuration: 60 },
    behavior: { frequencyTarget: 3, timeWindow: 'evening', commitment: 7 }
  });
  const navigate = useNavigate();

  const [customSubject, setCustomSubject] = useState('');

  const subjectOptions = [
    'DSA', 'Web Dev', 'Machine Learning', 'DBMS', 'OS', 'Networks',
    'Math', 'Physics', 'Chemistry', 'Biology', 'Statistics',
    'Python', 'Java', 'C++', 'JavaScript', 'React', 'Node.js',
    'Cloud Computing', 'Cyber Security', 'Artificial Intelligence',
    'Data Structures', 'Algorithms', 'Software Engineering',
    'Computer Architecture', 'Compiler Design', 'Digital Electronics'
  ];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !subjects.find(s => s.name === trimmed)) {
      setSubjects([...subjects, { name: trimmed, skill: 'Intermediate' }]);
    }
    setCustomSubject('');
  };

  const toggleSubject = (sub) => {
    if (subjects.find(s => s.name === sub)) {
      setSubjects(subjects.filter(s => s.name !== sub));
    } else {
      setSubjects([...subjects, { name: sub, skill: 'Intermediate' }]);
    }
  };

  const updateSubjectSkill = (name, skill) => {
    setSubjects(subjects.map(s => s.name === name ? { ...s, skill } : s));
  };

  const toggleDay = (day) => {
    if (availability.find(a => a.day === day)) {
      setAvailability(availability.filter(a => a.day !== day));
    } else {
      setAvailability([...availability, { day, startTime: '09:00', endTime: '17:00' }]);
    }
  };

  const handleComplete = async () => {
    try {
      await api.put('/users/onboarding', {
        subjects,
        availability,
        preferences: formData.preferences,
        behavior: formData.behavior
      });
      navigate('/app');
    } catch (err) {
      console.error(err);
      alert('Failed to complete onboarding');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                    s <= step
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      s < step ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600">Step {step} of 5</p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Your Subjects</h2>
              <p className="text-gray-600">Choose subjects you want to study and set your skill level</p>
              
              <div className="flex flex-wrap gap-3">
                {subjectOptions.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => toggleSubject(sub)}
                    className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                      subjects.find(s => s.name === sub)
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Custom subject input */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
                  placeholder="Type a subject not listed above..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button
                  onClick={addCustomSubject}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                >
                  + Add
                </button>
              </div>

              {subjects.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold text-gray-900">Set Skill Levels</h3>
                  {subjects.map((sub) => (
                    <div key={sub.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{sub.name}</span>
                      <select
                        value={sub.skill}
                        onChange={(e) => updateSubjectSkill(sub.name, e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Weekly Availability</h2>
              <p className="text-gray-600">Select the days you're available to study</p>
              
              <div className="grid grid-cols-2 gap-3">
                {days.map((day) => (
                  <label
                    key={day}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <input
                      type="checkbox"
                      checked={availability.some(a => a.day === day)}
                      onChange={() => toggleDay(day)}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="font-medium text-gray-900">{day}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Session Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.preferences.sessionDuration}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, sessionDuration: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Group Preferences</h2>
              <p className="text-gray-600">Tell us about your ideal study group</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Group Size
                </label>
                <input
                  type="number"
                  value={formData.preferences.groupSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, groupSize: parseInt(e.target.value) }
                  })}
                  min={2}
                  max={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Mode
                </label>
                <select
                  value={formData.preferences.mode}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, mode: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Preference
                </label>
                <select
                  value={formData.preferences.communication}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, communication: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="chat">Text</option>
                  <option value="voice">Voice</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Study Behavior</h2>
              <p className="text-gray-600">Help us understand your study habits</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Study Time
                </label>
                <select
                  value={formData.behavior.timeWindow}
                  onChange={(e) => setFormData({
                    ...formData,
                    behavior: { ...formData.behavior, timeWindow: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="morning">Morning (6am - 12pm)</option>
                  <option value="afternoon">Afternoon (12pm - 6pm)</option>
                  <option value="evening">Evening (6pm - 10pm)</option>
                  <option value="night">Night (10pm - 6am)</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
              <p className="text-gray-600">Please review your information before continuing</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map(s => (
                      <span key={s.name} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {s.name} ({s.skill})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-accent-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Availability</h3>
                  <p className="text-gray-700">{availability.length} days selected • {formData.preferences.sessionDuration} min sessions</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Preferences</h3>
                  <p className="text-gray-700">Group size: {formData.preferences.groupSize} • {formData.preferences.mode} • {formData.preferences.communication}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Study Behavior</h3>
                  <p className="text-gray-700">Preferred time: {formData.behavior.timeWindow}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="ml-auto px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition shadow-md"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="ml-auto px-6 py-3 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 transition shadow-md"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
