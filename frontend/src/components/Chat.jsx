import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function Chat({ user, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Fetch initial rooms
  useEffect(() => {
    fetch('http://localhost:3000/api/rooms')
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(err => console.error('Failed to fetch rooms:', err));
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('room_created', (room) => {
      setRooms(prev => [...prev, room]);
    });

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('room_created');
      socket.off('receive_message');
    };
  }, [socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinRoom = async (room) => {
    if (activeRoom) {
      socket.emit('leave_room', activeRoom.id);
    }
    
    setActiveRoom(room);
    socket.emit('join_room', room.id);

    // Fetch message history
    try {
      const res = await fetch(`http://localhost:3000/api/rooms/${room.id}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoom) return;

    const messageData = {
      room_id: activeRoom.id,
      user_id: user.id,
      content: messageInput,
      username: user.username
    };

    socket.emit('send_message', messageData);
    setMessageInput('');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      await fetch('http://localhost:3000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName })
      });
      setNewRoomName('');
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>ChatRooms</h3>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
        
        <ul className="room-list">
          {rooms.map(room => (
            <li 
              key={room.id} 
              className={`room-item ${activeRoom?.id === room.id ? 'active' : ''}`}
              onClick={() => handleJoinRoom(room)}
            >
              # {room.name}
            </li>
          ))}
        </ul>

        <form className="create-room" onSubmit={handleCreateRoom}>
          <input 
            type="text" 
            placeholder="New room name..." 
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <button type="submit">+</button>
        </form>
      </div>

      {/* Main Chat Area */}
      {activeRoom ? (
        <div className="chat-area">
          <div className="chat-header">
            # {activeRoom.name}
          </div>
          
          <div className="messages-container">
            {messages.map(msg => {
              const isSent = msg.user_id === user.id;
              return (
                <div key={msg.id} className={`message ${isSent ? 'sent' : 'received'}`}>
                  <div className="message-sender">{msg.username}</div>
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">{formatTime(msg.created_at)}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-input-area" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              className="message-input" 
              placeholder="Type a message..." 
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <button type="submit" className="send-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <div className="no-room-selected">
          Select a room to start chatting
        </div>
      )}
    </div>
  );
}

export default Chat;
