import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

function ChatRoom({ jwtToken }) {
  const { chatRoomId } = useParams();
  const [stompClient, setStompClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('연결되지 않음');
  const [chatMessages, setChatMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    connectToChatRoom();
    return () => disconnectFromChatRoom();
  }, [chatRoomId]);

  const connectToChatRoom = () => {
    console.log("소켓 연결 시도 중...");

    const socketUrl = `http://localhost:8080/ws/chat`;
    const client = Stomp.over(() => new SockJS(socketUrl));

    client.connect(
      { 'Authorization': `${jwtToken}` },
      () => {
        console.log("소켓 연결 성공!");
        setConnectionStatus('연결 성공!');
        setStompClient(client);

        client.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          setChatMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });
      },
      (error) => {
        console.error("소켓 연결 실패:", error);
        setConnectionStatus('연결 실패');
      }
    );
  };

  const disconnectFromChatRoom = () => {
    if (stompClient) {
      stompClient.send(`/app/chat.exit`, { 'Authorization': jwtToken }, JSON.stringify({
        chatRoomId: chatRoomId,
      }));
      stompClient.disconnect();
      setConnectionStatus('연결 해제됨');
      console.log("소켓 연결 해제됨");
    }
  };

  const sendMessage = () => {
    if (stompClient && messageContent.trim() !== '') {
      const chatMessage = {
        chatRoomId: chatRoomId,
        content: messageContent,
      };
      stompClient.send(`/app/chat.sendMessage`, { 'Authorization': jwtToken }, JSON.stringify(chatMessage));
      setMessageContent('');
    }
  };

  return (
    <div>
      <h2>채팅방 ID: {chatRoomId}</h2>
      <p>접속자 JWT: {jwtToken}</p>
      <p>연결 상태: {connectionStatus}</p>
      <div className="chat-box">
        {chatMessages.map((msg, index) => (
          <div key={index}>
            <strong>{`사용자 ${msg.senderId}`}</strong>: {msg.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        placeholder="메시지를 입력하세요"
      />
      <button onClick={sendMessage}>전송</button>
    </div>
  );
}

export default ChatRoom;
