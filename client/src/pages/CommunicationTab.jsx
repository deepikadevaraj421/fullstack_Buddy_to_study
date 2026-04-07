import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
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
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${isOwn ? 'bg-green-200 text-gray-800' : 'bg-green-100 text-gray-800 shadow'}`}>
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
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [inVoice, setInVoice] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState(group?.voiceParticipants || []);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (group?._id && (user?.preferences?.communication === 'chat' || user?.preferences?.communication === 'both')) {
      console.log('Loading messages for group:', group._id);
      loadMessages();

      // Connect to socket
      socketRef.current = io('http://localhost:5000');
      socketRef.current.on('connect', () => {
        console.log('Connected to socket');
        socketRef.current.emit('join-group', group._id);
      });
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Listen for new messages
      socketRef.current.on('new-message', (message) => {
        console.log('Received new message:', message);
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave-group', group._id);
          socketRef.current.disconnect();
        }
      };
    }
  }, [group]);

  useEffect(() => {
    const isIn = group?.voiceParticipants?.some(p => p._id === user?._id);
    setInVoice(!!isIn);
    setVoiceParticipants(group?.voiceParticipants || []);
  }, [group, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/groups/${group._id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async (type = 'text', content = '', files = [], audioBlob = null) => {
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

      const res = await api.post(`/groups/${group._id}/messages`, payload);
      // Add locally for immediate feedback
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      setAttachedFiles([]);
    } catch (err) {
      console.error('Failed to send message:', err);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const commPref = user?.preferences?.communication;
  const showChat = commPref === 'chat' || commPref === 'both';
  const showVoice = commPref === 'voice' || commPref === 'both';

  return (
    <div className="flex flex-col h-full">
      {showChat && (
        <div className="flex-1 flex flex-col border rounded-lg overflow-hidden bg-green-50">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(msg => (
              <ChatMessage key={msg._id} message={msg} isOwn={msg.userId._id === user._id} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t bg-green-100 sticky bottom-0">
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