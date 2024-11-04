import React, { useState, useEffect } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function ChatRoom({ chatRoomId, jwtToken }) {
  const [stompClient, setStompClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('연결되지 않음');
  const [chatMessages, setChatMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [userId] = useState(1); // 임의의 사용자 ID 설정 (테스트용)

  useEffect(() => {
    connectToChatRoom();
    return () => disconnectFromChatRoom();
  }, [chatRoomId]);

  const connectToChatRoom = () => {
    console.log("소켓 연결 시도 중...");

    const socketUrl = `http://localhost:8080/ws/chat`;
    const stompClient = Stomp.over(() => new SockJS(socketUrl));

    stompClient.connect(
      { 'Authorization': `${jwtToken}` },
      () => {
        console.log("소켓 연결 성공!");
        setConnectionStatus('연결 성공!');
        setStompClient(stompClient);

        // 채팅방 구독
        stompClient.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          setChatMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });

        // 채팅방 입장 알림
        stompClient.send(`/app/chat.enter`, {}, JSON.stringify({
          chatRoomId: chatRoomId,
          memberId: userId,
        }));
      },
      (error) => {
        console.error("소켓 연결 실패:", error);
        setConnectionStatus('연결 실패');
      }
    );
  };

  const disconnectFromChatRoom = () => {
    if (stompClient) {
      stompClient.send(`/app/chat.exit`, {}, JSON.stringify({
        chatRoomId: chatRoomId,
        memberId: userId,
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
        senderId: userId,
        content: messageContent,
      };
      stompClient.send(`/app/chat.sendMessage`, {}, JSON.stringify(chatMessage));
      setMessageContent('');
    }
  };

  return (
    <div>
      <h2>채팅방 ID: {chatRoomId}</h2>
      <p>연결 상태: {connectionStatus}</p>
      <div style={{ border: '1px solid black', height: '300px', overflowY: 'scroll' }}>
        {chatMessages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.senderId === userId ? '나' : `사용자 ${msg.senderId}`}</strong>: {msg.content}
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
