import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

function ChatRooms({ jwtToken }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
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
    fetchChatRooms();
  }, [jwtToken]);

  const handleRoomClick = async (chatRoomId) => {
    try {
    // token 확인용
    // console.log("before token : ",jwtToken)
    // const token = jwtToken.startsWith("Bearer ") ? jwtToken : `Bearer ${jwtToken}`;
    // console.log("after token : ",token)
    // 회원 여부 확인 API 호출
    const response = await axios.get(`http://localhost:8080/api/chat/${chatRoomId}/membership-check`, {
    headers: {
        Authorization: jwtToken,
    },
    });

    if (response.data.isSuccess) {
    const isMember = response.data.result;

        if (isMember) {
          // 회원일 경우 바로 채팅방으로 이동
          navigate(`/chat-room/${chatRoomId}`);
        } else {
          // 회원이 아닐 경우, 회원 가입 후 채팅방으로 이동
          await axios.post(`http://localhost:8080/api/chat/enter/${chatRoomId}`, {}, {
            headers: {
              Authorization: jwtToken,
            },
          });
          navigate(`/chat-room/${chatRoomId}`);
        }
      }
    } catch (error) {
      console.error("회원 여부 확인 중 오류 발생:", error);
      setError("채팅방에 입장할 수 없습니다.");
    }
  };
  

  return (
    <div className="chat-room-list">
      <h2>채팅방 목록</h2>
      {chatRooms.length > 0 ? (
        chatRooms.map((room) => (
          <div
            key={room.chatRoomId}
            className="chat-room-box"
            onClick={() => handleRoomClick(room.chatRoomId)}
          >
            {room.chatRoomName}
          </div>
        ))
      ) : (
        <p>채팅방이 없습니다.</p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ChatRooms;
