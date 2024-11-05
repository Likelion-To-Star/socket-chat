import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // 초기화

    try {
      const response = await axios.post('http://localhost:8080/api/member/login', {
        email,
        password,
      });

      // 로그인 성공 여부 확인
      if (response.data.isSuccess && response.data.result) {
        console.log("얻어온 jwt", response.data.result);
        console.log("사용자 email", email)
        const jwtToken = response.data.result;
        onLoginSuccess(jwtToken, email);
      } else {
        throw new Error('로그인 실패');
      }
    } catch (err) {
      console.error('로그인 실패:', err);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.');
    }
  };

  return (
    <div>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <label>
          이메일:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <br />
        <label>
          비밀번호:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <br />
        <button type="submit">로그인</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Login;
