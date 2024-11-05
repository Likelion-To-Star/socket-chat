import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import ChatRooms from './ChatRooms';
import ChatRoom from './ChatRoom';

function App() {
  const [jwtToken, setJwtToken] = useState(sessionStorage.getItem('jwtToken'));
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem('userEmail'));

  // 로그인 성공 시 JWT 토큰과 이메일 저장 및 이동
  const handleLoginSuccess = (token, email) => {
    sessionStorage.setItem('jwtToken', token);
    sessionStorage.setItem('userEmail', email);
    setJwtToken(token);
    setUserEmail(email);
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
              jwtToken && userEmail ? <Navigate to="/chat-rooms" /> : <Login onLoginSuccess={handleLoginSuccess} />
            }
          />
          <Route
            path="/chat-rooms"
            element={
              jwtToken && userEmail ? <ChatRooms jwtToken={jwtToken} userEmail={userEmail} /> : <Navigate to="/" />
            }
          />
          <Route
            path="/chat-room/:chatRoomId"
            element={
              jwtToken && userEmail ? <ChatRoom jwtToken={jwtToken} userEmail={userEmail} /> : <Navigate to="/" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
