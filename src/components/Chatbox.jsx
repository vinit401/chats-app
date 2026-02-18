import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import uncleBobby from "../../public/assets/default.jpg";
import { formatTimestamp } from "../utils/formateTimestamp";
import { RiSendPlaneFill } from "react-icons/ri";
import { BsCheckAll } from "react-icons/bs";
import logo from "../../public/assets/logo.png";
import {
  auth,
  listenForMessages,
  sendMessage,
  markMessagesAsRead,
  setTypingStatus,
  listenForTyping,
  listenToUserStatus,
} from "../firebase/firebase";

const Chatbox = ({ selectedUser, setSelectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState({ status: "offline", lastSeen: null });
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatId =
    auth?.currentUser?.uid < selectedUser?.uid
      ? `${auth?.currentUser?.uid}-${selectedUser?.uid}`
      : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;

  const senderEmail = auth?.currentUser?.email;

  // Listen for messages
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = listenForMessages(chatId, setMessages);
    return () => unsubscribe && unsubscribe();
  }, [chatId]);

  // Mark messages as read when chat opens or messages arrive
  useEffect(() => {
    if (!chatId) return;
    markMessagesAsRead(chatId);
  }, [chatId, messages]);

  // Listen for other user typing
  useEffect(() => {
    if (!chatId || !selectedUser?.uid) return;
    const unsubscribe = listenForTyping(chatId, selectedUser.uid, setIsTyping);
    return () => unsubscribe && unsubscribe();
  }, [chatId, selectedUser?.uid]);

  // Listen to other user's online status
  useEffect(() => {
    if (!selectedUser?.uid) return;
    const unsubscribe = listenToUserStatus(selectedUser.uid, setOtherUserStatus);
    return () => unsubscribe && unsubscribe();
  }, [selectedUser?.uid]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sortedMessages = useMemo(() => {
    if (!messages?.length) return [];
    return [...messages].sort((a, b) => {
      const aT = a?.timestamp?.seconds || 0;
      const bT = b?.timestamp?.seconds || 0;
      return aT - bT;
    });
  }, [messages]);

  // Typing handler with debounce
  const handleTyping = useCallback(
    (e) => {
      setMessageText(e.target.value);
      setTypingStatus(chatId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(chatId, false);
      }, 2000);
    },
    [chatId]
  );

  // Clear typing status on unmount or chat change
  useEffect(() => {
    return () => {
      setTypingStatus(chatId, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setTypingStatus(chatId, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendMessage(messageText, chatId, auth?.currentUser?.uid, selectedUser?.uid);
    setMessageText("");
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen?.seconds) return "a while ago";
    const date = new Date(lastSeen.seconds * 1000);
    const diffMins = Math.floor((Date.now() - date) / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  // Read receipt checkmark for sent messages
  const ReadReceipt = ({ msg }) => {
    const readBy = msg?.readBy || [];
    const isRead = readBy.includes(selectedUser?.uid);
    return (
      <BsCheckAll
        className="inline ml-1 flex-shrink-0"
        color={isRead ? "#01AA85" : "#aaa"}
        size={14}
      />
    );
  };

  if (!selectedUser) {
    return (
      <section className="h-full w-full bg-[#e5f6f3] flex flex-col justify-center items-center">
        <img src={logo} alt="" width={100} />
        <h1 className="text-[30px] font-bold text-teal-700 mt-5">
          Welcome to ChatKaro
        </h1>
        <p className="text-gray-700">
          Connect and chat with your friends and family.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col h-full w-full background-image overflow-hidden">

      {/* HEADER */}
      <header className="h-[70px] px-4 bg-white flex items-center gap-3 border-b flex-shrink-0">
        <button
          className="lg:hidden text-teal-600 font-bold mr-2 flex-shrink-0"
          onClick={() => setSelectedUser(null)}
        >
          ← Back
        </button>

        {/* Avatar with status dot */}
        <div className="relative flex-shrink-0">
          <img
            src={selectedUser?.image || uncleBobby}
            className="w-10 h-10 object-cover rounded-full"
            alt=""
          />
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors ${
              otherUserStatus.status === "online" ? "bg-green-400" : "bg-gray-400"
            }`}
          />
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold text-[#2A3D39] text-lg truncate">
            {selectedUser?.fullName || "Chatfrik User"}
          </h3>
          {/* Status line: typing > online > last seen */}
          {isTyping ? (
            <p className="text-[#01AA85] text-sm font-medium animate-pulse">
              typing...
            </p>
          ) : otherUserStatus.status === "online" ? (
            <p className="text-green-500 text-sm font-medium">Online</p>
          ) : (
            <p className="text-gray-400 text-sm">
              Last seen {formatLastSeen(otherUserStatus.lastSeen)}
            </p>
          )}
        </div>
      </header>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
        {sortedMessages.map((msg, index) => (
          <div key={msg.id || index}>
            {msg?.sender === senderEmail ? (
              <div className="flex justify-end mb-3">
                <div className="bg-white p-3 rounded-lg shadow-sm max-w-[75%]">
                  <p className="break-words">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-gray-400 text-xs">
                      {formatTimestamp(msg?.timestamp)}
                    </p>
                    <ReadReceipt msg={msg} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-start mb-3 gap-2">
                <img
                  src={selectedUser?.image || uncleBobby}
                  className="h-9 w-9 object-cover rounded-full flex-shrink-0 self-end"
                  alt=""
                />
                <div className="bg-white p-3 rounded-lg shadow-sm max-w-[75%]">
                  <p className="break-words">{msg.text}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatTimestamp(msg?.timestamp)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* TYPING INDICATOR BUBBLE */}
        {isTyping && (
          <div className="flex justify-start mb-3 gap-2 items-end">
            <img
              src={selectedUser?.image || uncleBobby}
              className="h-9 w-9 object-cover rounded-full flex-shrink-0"
              alt=""
            />
            <div className="bg-white px-4 py-3 rounded-lg shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT BOX */}
      <div className="bg-white p-3 border-t flex-shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center h-[50px] w-full px-2 rounded-lg shadow-md border relative"
        >
          <input
            value={messageText}
            onChange={handleTyping}
            className="h-full outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-full"
            type="text"
            placeholder="Write your message..."
          />
          <button
            type="submit"
            className="absolute right-3 p-2 rounded-full bg-[#D9f2ed]"
          >
            <RiSendPlaneFill color="#01AA85" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default Chatbox;