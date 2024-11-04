import React, { useState } from 'react';
import axios from 'axios';
import Login from './Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [error, setError] = useState('');

  // 로그인 성공 시 호출되는 함수
  const handleLoginSuccess = (jwtToken) => {
    console.log("jwt : ", jwtToken)
    localStorage.setItem('jwtToken', jwtToken); // JWT 저장
    setIsLoggedIn(true); // 로그인 상태로 전환
    fetchChatRooms(); // 채팅방 목록 가져오기
  };

  // 채팅방 목록을 가져오는 함수
  const fetchChatRooms = async () => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      if (!jwtToken) throw new Error('JWT 토큰이 없습니다.');

      const response = await axios.get('http://localhost:8080/api/chat/all', {
        headers: {
          Authorization: jwtToken, // JWT 토큰을 헤더에 포함
        },
      });

      if (response.data.isSuccess) {
        setChatRooms(response.data.result); // 채팅방 목록 설정
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
          {chatRooms.length > 0 ? (
            <ul>
              {chatRooms.map((room) => (
                <li key={room.chatRoomId}>{room.chatRoomName}</li>
              ))}
            </ul>
          ) : (
            <p>채팅방이 없습니다.</p>
          )}
        </div>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;
