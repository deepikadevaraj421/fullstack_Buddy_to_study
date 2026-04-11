import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import Avatar from './Avatar';

const EmojiPicker = ({ onSelect }) => {
  const emojis = ['😀','😂','😊','😍','😎','🤔','😢','😤','😡','🥺','😴','🤗','🤑','🙄','😬','😔','😷','🤒','🥳','🤓','😕','😦','😨','😱','😞','😩','😫','😠','🤬','😈','👿','💀','💩','🤖','😺','😸','😻','😼','🙀','😿'];
  return (
    <div className="absolute bottom-12 left-0 bg-white border rounded-lg p-2 shadow-lg max-h-40 overflow-y-auto z-10">
      <div className="grid grid-cols-8 gap-1">
        {emojis.map(emoji => (
          <button key={emoji} onClick={() => onSelect(emoji)} className="text-lg hover:bg-gray-100 p-1 rounded">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatMessage = ({ message, isOwn }) => {
  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <Avatar user={message.userId} size="sm" className="mr-2" />
      )}
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn ? 'bg-green-300 text-gray-800' : 'bg-white text-gray-800 shadow'}`}>
        {!isOwn && <div className="text-xs font-semibold text-gray-600 mb-1">{message.userId?.name}</div>}
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className={`text-[10px] text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp || message.createdAt)}
        </div>
      </div>
    </div>
  );
};

const CommunicationTab = ({ group, user, refreshGroup }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const loadMessages = async () => {
    if (!group?._id) return;
    try {
      const res = await api.get(`/groups/${group._id}/messages`);
      setMessages(res.data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!group?._id) return;
    setIsLoading(true);
    setMessages([]);
    loadMessages();
    pollIntervalRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollIntervalRef.current);
  }, [group?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await api.post(`/groups/${group._id}/messages`, { type: 'text', content: newMessage });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      setTimeout(loadMessages, 300);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    }
  };

  if (!group?._id || !user) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex flex-col" style={{ height: '500px' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-t-lg border border-b-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">Loading chat history...</p>
          </div>
        ) : loadError ? (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            ⚠️ {loadError}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-8 text-sm">No messages yet — start the conversation!</p>
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg._id}
              message={msg}
              isOwn={msg.userId?._id === user._id || msg.userId === user._id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border border-t-0 bg-white rounded-b-lg relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(p => !p)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            😀
          </button>
          <input type="file" ref={fileInputRef} className="hidden" multiple />
          <button
            onClick={() => fileInputRef.current.click()}
            className="text-gray-500 hover:text-gray-700"
          >
            📎
          </button>
          <input
            type="text"
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Type a message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition text-sm font-medium"
          >
            Send
          </button>
        </div>
        {showEmojiPicker && (
          <EmojiPicker onSelect={(emoji) => { setNewMessage(p => p + emoji); setShowEmojiPicker(false); }} />
        )}
      </div>
    </div>
  );
};

export default CommunicationTab;
