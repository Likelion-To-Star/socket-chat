import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [error, setError] = useState('');

  const handleLoginSuccess = (jwtToken) => {
    localStorage.setItem('jwtToken', jwtToken);
    setIsLoggedIn(true);
    fetchChatRooms();
  };

  const fetchChatRooms = async () => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      if (!jwtToken) throw new Error('JWT 토큰이 없습니다.');

      const response = await axios.get('http://localhost:8080/api/chat/all', {
        headers: {
          Authorization: jwtToken,
        },
      });

      if (response.data.isSuccess) {
        setChatRooms(response.data.result);
      } else {
        throw new Error('채팅방 목록을 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('채팅방 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>채팅 애플리케이션</h1>
      </header>
      {isLoggedIn ? (
        <div>
          <h2>채팅방 목록</h2>
          <div className="chat-room-list">
            {chatRooms.length > 0 ? (
              chatRooms.map((room) => (
                <div key={room.chatRoomId} className="chat-room-box">
                  {room.chatRoomName}
                </div>
              ))
            ) : (
              <p>채팅방이 없습니다.</p>
            )}
          </div>
        </div>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;