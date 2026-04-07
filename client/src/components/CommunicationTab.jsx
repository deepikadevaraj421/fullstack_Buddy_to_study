import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

// Simple Emoji Picker Component
const EmojiPicker = ({ onSelect }) => {
  const emojis = ['😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😮', '😢', '😭', '😤', '😡', '🥺', '😴', '🤗', '🤭', '🤫', '🤥', '🤑', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  return (
    <div className="absolute bottom-12 left-0 bg-white border rounded-lg p-2 shadow-lg max-h-40 overflow-y-auto">
      <div className="grid grid-cols-8 gap-1">
        {emojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-lg hover:bg-gray-100 p-1 rounded"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// File Preview Component
const FilePreview = ({ files, onRemove }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {files.map((file, index) => (
        <div key={index} className="bg-gray-100 rounded-lg p-2 flex items-center gap-2">
          <span className="text-sm">{file.name}</span>
          <button onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700">×</button>
        </div>
      ))}
    </div>
  );
};

// Chat Message Component
const ChatMessage = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600">{message.userId.name.charAt(0)}</span>
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${isOwn ? 'bg-green-300 text-gray-800' : 'bg-green-200 text-gray-800 shadow'}`}>
        {!isOwn && <div className="text-xs font-semibold text-gray-600 mb-1">{message.userId.name}</div>}
        {message.type === 'text' && <div className="whitespace-pre-wrap">{message.content}</div>}
        {message.type === 'file' && (
          <div>
            <div className="text-sm">{message.fileName}</div>
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm">Download</a>
          </div>
        )}
        {message.type === 'audio' && (
          <audio controls className="max-w-full">
            <source src={message.audioUrl} type="audio/webm" />
          </audio>
        )}
        <div className={`text-[10px] text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

const CommunicationTab = ({ group, user, refreshGroup }) => {
  // Guard clauses
  if (!group?._id) {
    return <div className="p-4 text-gray-500">Loading group...</div>;
  }
  
  if (!user) {
    return <div className="p-4 text-gray-500">Loading user...</div>;
  }

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [inVoice, setInVoice] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState(group?.voiceParticipants || []);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Syncing…');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Load messages from server
  const loadMessages = async () => {
    if (!group?._id) {
      console.warn('Cannot load messages - no group ID');
      setIsLoading(false);
      return;
    }
    
    try {
      setLoadError(null);
      console.log(`📥 Fetching messages for group ${group._id}`);
      const res = await api.get(`/groups/${group._id}/messages`);
      console.log(`✓ Fetched ${res.data.length} messages`);
      setMessages(res.data);
      setLastSyncTime(new Date());
      setSyncStatus('✓ Synced');
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load messages:', err);
      const errMsg = err.response?.data?.error || err.message;
      setLoadError(`Failed to fetch messages: ${errMsg}`);
      setSyncStatus('✗ Failed');
      setIsLoading(false);
    }
  };

  // Poll for messages every 3 seconds
  useEffect(() => {
    if (!group?._id || !(user?.preferences?.communication === 'chat' || user?.preferences?.communication === 'both')) {
      return;
    }

    console.log('Initializing message sync for group:', group._id);
    // Load messages immediately on mount
    loadMessages();

    // Set up polling interval
    pollIntervalRef.current = setInterval(() => {
      console.log('Polling for new messages');
      loadMessages();
    }, 3000);

    // Update voice participants when group changes
    setVoiceParticipants(group?.voiceParticipants || []);
    const isIn = group?.voiceParticipants?.some(p => p._id === user?._id);
    setInVoice(!!isIn);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [group?._id, user?.preferences?.communication]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceToggle = async () => {
    try {
      if (inVoice) {
        await api.post(`/groups/${group._id}/voice/leave`);
      } else {
        await api.post(`/groups/${group._id}/voice/join`);
      }
      if (refreshGroup) await refreshGroup();
    } catch (err) {
      console.error('Voice toggle failed:', err);
    }
  };
  
  const sendMessage = async (type = 'text', content = '', files = [], audioBlob = null) => {
    if (!group?._id) {
      alert('Error: Group not loaded');
      return;
    }

    try {
      let payload = { type };
      if (type === 'text') payload.content = content;
      else if (type === 'file') {
        // Placeholder: in real app, upload files first
        payload.files = files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
      } else if (type === 'audio') {
        // Placeholder: upload audio
        payload.audioUrl = URL.createObjectURL(audioBlob);
      }

      console.log(`📤 Sending ${type} message to group ${group._id}:`, payload);
      const res = await api.post(`/groups/${group._id}/messages`, payload);
      console.log(`✓ Message sent (ID: ${res.data._id})`);

      // Optimize: append message immediately, then refresh
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      setAttachedFiles([]);
      
      // Re-sync after 500ms to ensure we get all updates
      setTimeout(loadMessages, 500);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(`Error sending message: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleSendText = () => {
    if (newMessage.trim() || attachedFiles.length > 0) {
      if (attachedFiles.length > 0) {
        sendMessage('file', '', attachedFiles);
      } else {
        sendMessage('text', newMessage);
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        sendMessage('audio', '', [], blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const commPref = user?.preferences?.communication || 'both';
  const showChat = commPref === 'chat' || commPref === 'both';
  const showVoice = commPref === 'voice' || commPref === 'both';

  return (
    <div className="flex flex-col h-full">
      {/* if user only has voice preference, let them know chat is disabled */}
      {!showChat && showVoice && (
        <div className="text-sm text-yellow-600 mb-2">
          Your profile is set to voice-only; switch to chat or both to enable text messages.
        </div>
      )}
      {showChat && (
        <div className="h-96 flex flex-col border rounded-lg overflow-hidden bg-green-50">
          <div className="flex-1 overflow-y-auto p-4 bg-green-100">
            {/* sync status */}
            <div className={`text-xs mb-3 font-semibold ${syncStatus.includes('✓') ? 'text-green-600' : syncStatus.includes('✗') ? 'text-red-600' : 'text-orange-600'}`}>
              {syncStatus}{lastSyncTime && ` • ${lastSyncTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
            </div>
            {loadError && (
              <div className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded border border-red-200">
                ⚠️ {loadError}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p className="text-sm">Loading chat history...</p>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">
                No messages yet – start the conversation!
              </p>
            ) : (
              messages.map(msg => (
                <ChatMessage key={msg._id} message={msg} isOwn={msg.userId._id === user._id} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t bg-green-200 sticky bottom-0">
            <FilePreview files={attachedFiles} onRemove={removeFile} />
            <div className="flex items-center gap-2">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-500 hover:text-gray-700">
                😀
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <button onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-gray-700">
                📎
              </button>
              <input
                type="text"
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type a message"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendText()}
              />
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-500">🔴 Recording {recordingTime}s</span>
                  <button onClick={stopRecording} className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                    Stop
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={startRecording} className="text-gray-500 hover:text-gray-700">
                    🎤
                  </button>
                  <button
                    onClick={handleSendText}
                    className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
                  >
                    ➤
                  </button>
                </>
              )}
            </div>
            {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelect} />}
          </div>
        </div>
      )}

      {showVoice && (
        <div className="mt-6 bg-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold mb-2">Voice Room (Demo)</h3>
          <button
            onClick={handleVoiceToggle}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              inVoice ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {inVoice ? 'Leave Room' : 'Join Room'}
          </button>
          <div className="mt-4">
            <p className="font-medium mb-1">Participants:</p>
            <ul className="list-disc list-inside">
              {voiceParticipants.length === 0 ? (
                <li className="text-gray-500">No one is in voice</li>
              ) : (
                voiceParticipants.map(p => <li key={p._id}>{p.name}</li>)
              )}
            </ul>
          </div>
        </div>
      )}

      {!showChat && !showVoice && (
        <p className="text-gray-600">No communication permissions in your profile.</p>
      )}
    </div>
  );
};

export default CommunicationTab;