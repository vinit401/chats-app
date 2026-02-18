import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import uncleBobby from "../../public/assets/default.jpg";
import { formatTimestamp } from "../utils/formateTimestamp";
import { RiSendPlaneFill } from "react-icons/ri";
import { BsCheckAll } from "react-icons/bs";
import logo from "../../public/assets/logo.png";
import UserProfileModal from "./UserProfileModal";
import { useDarkMode } from "../context/DarkModeContext";
import {
  auth,
  listenForMessages,
  sendMessage,
  markMessagesAsRead,
  setTypingStatus,
  listenForTyping,
  listenToUserStatus,
} from "../firebase/firebase";

// ── Simple beep sound using Web Audio API ──────────────────────────────────
const playMessageSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not supported — fail silently
  }
};

// ── Request browser notification permission ────────────────────────────────
const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

const showPushNotification = (title, body, icon) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

const Chatbox = ({ selectedUser, setSelectedUser }) => {
  const { darkMode } = useDarkMode();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  const chatId =
    auth?.currentUser?.uid < selectedUser?.uid
      ? `${auth?.currentUser?.uid}-${selectedUser?.uid}`
      : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;

  const senderEmail = auth?.currentUser?.email;

  // Request notification permission once on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Reset on user change
  useEffect(() => {
    isFirstLoadRef.current = true;
    prevMessageCountRef.current = 0;
  }, [chatId]);

  // Listen for messages
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = listenForMessages(chatId, setMessages);
    return () => unsubscribe && unsubscribe();
  }, [chatId]);

  // Sound + push notification on new incoming message
  useEffect(() => {
    if (!messages.length) return;

    const sorted = [...messages].sort(
      (a, b) => (a?.timestamp?.seconds || 0) - (b?.timestamp?.seconds || 0)
    );

    // Skip notifications on the initial load
    if (isFirstLoadRef.current) {
      prevMessageCountRef.current = sorted.length;
      isFirstLoadRef.current = false;
      return;
    }

    // If new messages arrived
    if (sorted.length > prevMessageCountRef.current) {
      const newMessages = sorted.slice(prevMessageCountRef.current);
      newMessages.forEach((msg) => {
        // Only notify for incoming messages (not ones we sent)
        if (msg.sender !== senderEmail) {
          playMessageSound();
          showPushNotification(
            selectedUser?.fullName || "New Message",
            msg.text,
            selectedUser?.image
          );
        }
      });
      prevMessageCountRef.current = sorted.length;
    }
  }, [messages, senderEmail, selectedUser]);

  // Mark messages as read
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
    setOtherUserStatus(null);
    const unsubscribe = listenToUserStatus(selectedUser.uid, setOtherUserStatus);
    return () => unsubscribe && unsubscribe();
  }, [selectedUser?.uid]);

  // Auto scroll
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

  const isOnline = otherUserStatus?.status === "online";

  const renderStatusLine = () => {
    if (isTyping) {
      return <p className="text-[#01AA85] text-sm font-medium animate-pulse">typing...</p>;
    }
    if (otherUserStatus === null) {
      return <p className="text-gray-300 text-sm">...</p>;
    }
    if (isOnline) {
      return <p className="text-green-500 text-sm font-medium">Online</p>;
    }
    return (
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
        Last seen {formatLastSeen(otherUserStatus.lastSeen)}
      </p>
    );
  };

  const ReadReceipt = ({ msg }) => {
    const readBy = msg?.readBy || [];
    const isRead = readBy.includes(selectedUser?.uid);
    return (
      <BsCheckAll className="inline ml-1 flex-shrink-0" color={isRead ? "#01AA85" : "#aaa"} size={14} />
    );
  };

  // Dark mode classes
  const dm = {
    section: darkMode ? "bg-[#0f1a17]" : "",
    header: darkMode ? "bg-[#1a2520] border-white/10" : "bg-white border-b",
    bubble_me: darkMode ? "bg-[#01AA85] text-white" : "bg-white",
    bubble_other: darkMode ? "bg-[#1e2a27] text-white" : "bg-white",
    time_me: darkMode ? "text-white/60" : "text-gray-400",
    time_other: darkMode ? "text-white/60" : "text-gray-400",
    input_wrap: darkMode ? "bg-[#1a2520] border-white/10" : "bg-white border-t",
    input: darkMode ? "bg-[#0f1a17] text-white placeholder:text-gray-500 border-white/10" : "bg-white",
  };

  if (!selectedUser) {
    return (
      <section className={`h-full w-full flex flex-col justify-center items-center ${darkMode ? "bg-[#0f1a17]" : "bg-[#e5f6f3]"}`}>
        <img src={logo} alt="" width={100} />
        <h1 className={`text-[30px] font-bold mt-5 ${darkMode ? "text-teal-400" : "text-teal-700"}`}>
          Welcome to ChatKaro
        </h1>
        <p className={darkMode ? "text-gray-400" : "text-gray-700"}>
          Connect and chat with your friends and family.
        </p>
      </section>
    );
  }

  return (
    <section className={`flex flex-col h-full w-full overflow-hidden background-image ${darkMode ? "bg-[#0f1a17]" : ""}`}>

      {/* HEADER */}
      <header className={`h-[70px] px-4 flex items-center gap-3 flex-shrink-0 ${dm.header}`}>
        <button
          className="lg:hidden text-teal-600 font-bold mr-2 flex-shrink-0"
          onClick={() => setSelectedUser(null)}
        >
          ← Back
        </button>

        {/* Clickable avatar → opens profile modal */}
        <button
          className="relative flex-shrink-0 cursor-pointer"
          onClick={() => setShowProfile(true)}
          aria-label="View profile"
        >
          <img
            src={selectedUser?.image || uncleBobby}
            className="w-10 h-10 object-cover rounded-full hover:opacity-90 transition-opacity"
            alt=""
          />
          {otherUserStatus !== null && (
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                isOnline ? "bg-green-400" : "bg-gray-400"
              }`}
            />
          )}
        </button>

        {/* Clickable name → opens profile modal */}
        <button className="min-w-0 text-left" onClick={() => setShowProfile(true)}>
          <h3 className={`font-semibold text-lg truncate ${darkMode ? "text-white" : "text-[#2A3D39]"}`}>
            {selectedUser?.fullName || "Chatfrik User"}
          </h3>
          {renderStatusLine()}
        </button>
      </header>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
        {sortedMessages.map((msg, index) => (
          <div key={msg.id || index}>
            {msg?.sender === senderEmail ? (
              <div className="flex justify-end mb-3">
                <div className={`p-3 rounded-lg shadow-sm max-w-[75%] ${dm.bubble_me}`}>
                  <p className="break-words">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className={`text-xs ${dm.time_me}`}>{formatTimestamp(msg?.timestamp)}</p>
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
                <div className={`p-3 rounded-lg shadow-sm max-w-[75%] ${dm.bubble_other}`}>
                  <p className="break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${dm.time_other}`}>{formatTimestamp(msg?.timestamp)}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="flex justify-start mb-3 gap-2 items-end">
            <img
              src={selectedUser?.image || uncleBobby}
              className="h-9 w-9 object-cover rounded-full flex-shrink-0"
              alt=""
            />
            <div className={`px-4 py-3 rounded-lg shadow-sm flex items-center gap-1 ${darkMode ? "bg-[#1e2a27]" : "bg-white"}`}>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT BOX */}
      <div className={`p-3 flex-shrink-0 ${dm.input_wrap}`}>
        <form
          onSubmit={handleSendMessage}
          className={`flex items-center h-[50px] w-full px-2 rounded-lg shadow-md border relative ${dm.input}`}
        >
          <input
            value={messageText}
            onChange={handleTyping}
            className={`h-full outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-full ${dm.input}`}
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

      {/* USER PROFILE MODAL */}
      {showProfile && (
        <UserProfileModal
          user={{ ...selectedUser, status: otherUserStatus?.status }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </section>
  );
};

export default Chatbox;