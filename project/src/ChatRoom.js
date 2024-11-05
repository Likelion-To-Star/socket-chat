import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useNavigate import 추가
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios'; // axios import 추가
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
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('연결되지 않음');
  const [chatMessages, setChatMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const userEmail = sessionStorage.getItem("userEmail");
  const stompClient = useRef(null);
  const isConnecting = useRef(false); // 중복 연결 방지 플래그
  const subscriptionId = useRef(null); // 구독 ID 저장

  useEffect(() => {
    console.log("ChatRoom 컴포넌트 mounted");
    
    // 기존 메시지 가져오기
    fetchChatHistory();

    if (!stompClient.current && !isConnecting.current) {
      console.log("connectToChatRoom 호출 준비 완료 - 현재 stompClient는 초기화되지 않음");
      connectToChatRoom();
    } else {
      console.log("stompClient가 이미 초기화된 상태 또는 연결 중 상태 - 연결 생략");
    }

    return () => {
      // 컴포넌트 언마운트 시 구독 해제
      if (subscriptionId.current) {
        console.log("뒤로가기 - 구독만 해제");
        stompClient.current.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [chatRoomId]);

  const fetchChatHistory = async () => {
    try {
      console.log("기존 메시지 가져오는 중...");
      const response = await axios.get(`http://localhost:8080/api/chatroom/all/${chatRoomId}`, {
        headers: {
          Authorization: jwtToken,
        },
      });

      if (response.data.isSuccess) {
        console.log("기존 메시지 가져오기 성공:", response.data.result);
        setChatMessages(response.data.result);
      } else {
        console.error("기존 메시지 가져오기 실패:", response.data.message);
      }
    } catch (error) {
      console.error("기존 메시지 가져오는 중 오류 발생:", error);
    }
  };

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

        // 구독 및 ID 저장
        subscriptionId.current = client.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log("새로운 메시지 수신:", receivedMessage);
          setChatMessages((prevMessages) => [...prevMessages, receivedMessage]);
        }).id;
      },
      (error) => {
        console.error("소켓 연결 실패:", error);
        setConnectionStatus('연결 실패');
        isConnecting.current = false; // 연결 실패 후 상태 해제
      }
    );
  };

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

  const handleBack = () => {
    // 뒤로가기 버튼 클릭 시, 구독만 해제하고 소켓 연결 유지
    if (subscriptionId.current) {
      console.log("뒤로가기 - 구독만 해제");
      stompClient.current.unsubscribe(subscriptionId.current);
      subscriptionId.current = null;
    }
    navigate(-1); // 뒤로가기
  };

  return (
    <div>
      <h2>채팅방 ID: {chatRoomId}</h2>
      <p>접속자 : {userEmail}</p>
      <p>연결 상태: {connectionStatus}</p>
      <div className="chat-box">
        {chatMessages.map((msg, index) => {
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
      <button onClick={handleBack}>뒤로가기</button>
    </div>
  );
}

export default ChatRoom;
