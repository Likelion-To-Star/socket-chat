import React, { useState, useEffect } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function App() {
  const [stompClient, setStompClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('연결되지 않음');
  const [chatMessages, setChatMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [chatRoomId] = useState(1); // 테스트할 채팅방 ID
  const [userId] = useState(1); // 테스트할 사용자 ID
  const jwtToken = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InkyXzEyQG5hdmVyLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3MzA3MDkyNDYsImV4cCI6MTczMDc5NTY0Nn0.z8KZdo7cPf2vG3Sx_fL_5LESiOoZHF9isurJWGjRgQ8'

  useEffect(() => {
    connectToChatRoom();
    return () => disconnectFromChatRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectToChatRoom = () => {
    console.log("소켓 연결 시도 중...");

    const socketUrl = `http://localhost:8080/ws/chat`;
    const stompClient = Stomp.over(() => new SockJS(socketUrl));

    stompClient.connect(
      { 'Authorization': `Bearer ${jwtToken}` },
      () => {
        console.log("소켓 연결 성공!");
        setConnectionStatus('연결 성공!');
        setStompClient(stompClient);

        // 채팅방 구독 : 새로운 메시지가 도착하였을때 알려달라고 요청(구독)
        // /topic 을 통해 구독이 가능하며, /chatroom/1 이 구독할 주소에 해당
        stompClient.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          // 새로운 메시지 도착시 함수 실행
          setChatMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });

        // 채팅방 입장 알림 - 최초 입장시에만 알리도록 수정 필요
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
      // 채팅방 퇴장 알림
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
    <div className="App">
      <header className="App-header">
        <h1>Chat Application</h1>
      </header>
      <div>
        <p>연결 상태: {connectionStatus}</p>
        <div>
          <h2>채팅방 ID: {chatRoomId}</h2>
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
      </div>
    </div>
  );
}

export default App;
