import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

// 입장 & 퇴장 알림용
function EntryExitMessage({ message }) {
  return (
    <div className="entry-exit-message">
      <strong>{message.content}</strong>
    </div>
  );
}

// 전달받은 메시지
function IncomingMessage({ message }) {
  return (
    <div className="incoming-message">
      <strong>{message.email}</strong>: {message.content}
    </div>
  );
}

// 전송한 메시지 (나의 메시지)
function OutgoingMessage({ message }) {
  return (
    <div className="outgoing-message">
      <strong>나:</strong> {message.content}
    </div>
  );
}

function ChatRoom({ jwtToken }) {
  const { chatRoomId } = useParams();
  const [connectionStatus, setConnectionStatus] = useState('연결되지 않음');
  const [chatMessages, setChatMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const userEmail = sessionStorage.getItem("userEmail");
  const stompClient = useRef(null);
  const isConnecting = useRef(false); // 중복 연결 방지 플래그

  useEffect(() => {
    console.log("ChatRoom 컴포넌트 mounted");
    if (!stompClient.current && !isConnecting.current) {
      console.log("connectToChatRoom 호출 준비 완료 - 현재 stompClient는 초기화되지 않음");
      connectToChatRoom();
    } else {
      console.log("stompClient가 이미 초기화된 상태 또는 연결 중 상태 - 연결 생략");
    }

    // return () => {
    // 채팅방 컴포넌트 종료시 필요하다면 구독 취소하는 로직 작성
    //   console.log("ChatRoom 컴포넌트 unmounted - disconnectFromChatRoom 호출 예정");
    //   disconnectFromChatRoom();
    // };
  }, [chatRoomId]);

  // 채팅방 연결 - 소켓
  const connectToChatRoom = () => {
    if (isConnecting.current || (stompClient.current && stompClient.current.connected)) {
      console.log("이미 연결 중이거나 연결된 상태이므로 새로운 연결을 생성하지 않음");
      return;
    }

    console.log("소켓 연결 시도 중...");
    isConnecting.current = true; // 연결 시도 중 상태 설정
    const socketUrl = `http://localhost:8080/ws/chat`;
    const client = Stomp.over(() => new SockJS(socketUrl));

    client.connect(
      { 'Authorization': `${jwtToken}` },
      () => {
        setConnectionStatus('연결 성공!');
        stompClient.current = client;
        isConnecting.current = false; // 연결 성공 후 상태 해제
        console.log("WebSocket 연결 성공 및 구독 시작");

        // topic 키워드를 통해 chatroom/{chatRoomId} 에 대한 정보를 구독한다.
        // 새로운 메시지 전송시 구독해뒀다면 메시지 객체가 반환된다.
        client.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log("새로운 메시지 수신:", receivedMessage);
          setChatMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });
      },
      (error) => {
        console.error("소켓 연결 실패:", error);
        setConnectionStatus('연결 실패');
        isConnecting.current = false; // 연결 실패 후 상태 해제
      }
    );
  };

  // 채팅방 나가기(탈퇴)에 해당, 채팅방 회원에서 기존 회원을 제거한다.
  const disconnectFromChatRoom = () => {
    if (stompClient.current && stompClient.current.connected) {
      console.log("채팅방 나가기 호출됨 - 연결 종료 예정");
      stompClient.current.send(`/app/chat.exit`, { 'Authorization': jwtToken }, JSON.stringify({
        chatRoomId: chatRoomId,
      }));
      stompClient.current.disconnect(() => {
        console.log("연결 해제 완료");
        setConnectionStatus('연결 해제됨');
        stompClient.current = null; // 연결 해제 후 stompClient 초기화
      });
    } else {
      console.log("disconnectFromChatRoom - 연결된 stompClient가 없으므로 해제하지 않음");
    }
  };

  // 메시지 발송
  const sendMessage = () => {
    if (stompClient.current && stompClient.current.connected && messageContent.trim() !== '') {
      const chatMessage = {
        chatRoomId: chatRoomId,
        content: messageContent,
      };
      stompClient.current.send(`/app/chat.sendMessage`, { 'Authorization': jwtToken }, JSON.stringify(chatMessage));
      setMessageContent('');
      console.log("메시지 전송:", chatMessage);
    } else {
      console.log("메시지 전송 실패 - stompClient가 연결되지 않았거나 메시지가 비어 있음");
    }
  };

  return (
    <div>
      <h2>채팅방 ID: {chatRoomId}</h2>
      <p>접속자 : {userEmail}</p>
      <p>연결 상태: {connectionStatus}</p>
      <div className="chat-box">
        {chatMessages.map((msg, index) => {
          // 채팅 타입과, 이메일을 비교하여 컴포넌트 변경
          if (msg.messageType === "ANNOUNCE") {
            return <EntryExitMessage key={index} message={msg} />;
          } else if (msg.messageType === "TALK" && msg.email !== userEmail) {
            return <IncomingMessage key={index} message={msg} />;
          } else if (msg.messageType === "TALK" && msg.email === userEmail) {
            return <OutgoingMessage key={index} message={msg} />;
          }
          return null;
        })}
      </div>
      <input
        type="text"
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        placeholder="메시지를 입력하세요"
      />
      <button onClick={sendMessage}>전송</button>
      <button onClick={disconnectFromChatRoom}>채팅방 나가기</button>
    </div>
  );
}

export default ChatRoom;
