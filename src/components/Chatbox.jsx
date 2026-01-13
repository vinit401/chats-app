import React, { useEffect, useRef, useMemo, useState } from "react";
import uncleBobby from "../../public/assets/default.jpg";
import { formatTimestamp } from "../utils/formateTimestamp";
import { RiSendPlaneFill } from "react-icons/ri";
import logo from "../../public/assets/logo.png";
import { auth, listenForMessages, sendMessage } from "../firebase/firebase";

const Chatbox = ({ selectedUser, setSelectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const bottomRef = useRef(null);

  const chatId =
    auth?.currentUser?.uid < selectedUser?.uid
      ? `${auth?.currentUser?.uid}-${selectedUser?.uid}`
      : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;

  const senderEmail = auth?.currentUser?.email;

  // Listen messages
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = listenForMessages(chatId, setMessages);
    return () => unsubscribe && unsubscribe();
  }, [chatId]);

  // Auto scroll bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sortedMessages = useMemo(() => {
    if (!messages?.length) return [];
    return [...messages].sort((a, b) => {
      const aT = a?.timestamp?.seconds || 0;
      const bT = b?.timestamp?.seconds || 0;
      return aT - bT;
    });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessage(messageText, chatId, auth?.currentUser?.uid, selectedUser?.uid);
    setMessageText("");
  };

  if (!selectedUser) {
    return (
      <section className="h-[100dvh] w-full bg-[#e5f6f3] flex flex-col justify-center items-center">
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
    <section className="flex flex-col h-[100dvh] w-full background-image">

      {/* HEADER */}
      <header className="h-[70px] px-4 bg-white flex items-center gap-3 border-b shrink-0">
        <button
          className="lg:hidden text-teal-600 font-bold mr-2"
          onClick={() => setSelectedUser(null)}
        >
          ← Back
        </button>

        <img
          src={selectedUser?.image || uncleBobby}
          className="w-10 h-10 object-cover rounded-full"
          alt=""
        />

        <div>
          <h3 className="font-semibold text-[#2A3D39] text-lg">
            {selectedUser?.fullName || "Chatfrik User"}
          </h3>
          <p className="font-light text-[#2A3D39] text-sm">
            @{selectedUser?.username || "chatfrik"}
          </p>
        </div>
      </header>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sortedMessages.map((msg, index) => (
          <div key={index}>
            {msg?.sender === senderEmail ? (
              <div className="flex justify-end mb-3">
                <div className="bg-white p-3 rounded-lg shadow-sm max-w-[75%]">
                  <p>{msg.text}</p>
                  <p className="text-gray-400 text-xs mt-1 text-right">
                    {formatTimestamp(msg?.timestamp)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-start mb-3 gap-2">
                <img
                  src={uncleBobby}
                  className="h-9 w-9 object-cover rounded-full"
                  alt=""
                />
                <div className="bg-white p-3 rounded-lg shadow-sm max-w-[75%]">
                  <p>{msg.text}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatTimestamp(msg?.timestamp)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BOX */}
      <div className="bg-white p-3 border-t shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center h-[50px] w-full px-2 rounded-lg shadow-md border relative"
        >
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
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
