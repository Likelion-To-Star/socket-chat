import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import ChatRooms from './ChatRooms';
import ChatRoom from './ChatRoom';

function App() {
  const [jwtToken, setJwtToken] = useState(sessionStorage.getItem('jwtToken'));

  // 로그인 성공 시 JWT 토큰 저장 및 이동
  const handleLoginSuccess = (token) => {
    sessionStorage.setItem('jwtToken', token);
    setJwtToken(token);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>채팅 애플리케이션</h1>
        </header>
        <Routes>
          <Route
            path="/"
            element={
              jwtToken ? <Navigate to="/chat-rooms" /> : <Login onLoginSuccess={handleLoginSuccess} />
            }
          />
          <Route
            path="/chat-rooms"
            element={
              jwtToken ? <ChatRooms jwtToken={jwtToken} /> : <Navigate to="/" />
            }
          />
          <Route
            path="/chat-room/:chatRoomId"
            element={
              jwtToken ? <ChatRoom jwtToken={jwtToken} /> : <Navigate to="/" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
