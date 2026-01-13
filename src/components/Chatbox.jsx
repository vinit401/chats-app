import React, { useEffect, useRef, useMemo, useState } from "react";
import uncleBobby from "../../public/assets/default.jpg";
import { formatTimestamp } from "../utils/formateTimestamp";
import { RiSendPlaneFill } from "react-icons/ri";
import logo from "../../public/assets/logo.png";
import { auth, listenForMessages, sendMessage } from "../firebase/firebase";

const Chatbox = ({ selectedUser, setSelectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, sendMessageText] = useState("");

  const scrollRef = useRef(null);

  const chatId =
    auth?.currentUser?.uid < selectedUser?.uid
      ? `${auth?.currentUser?.uid}-${selectedUser?.uid}`
      : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;

  const senderEmail = auth?.currentUser?.email;

  // 🔥 Realtime messages listener
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = listenForMessages(chatId, setMessages);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ✅ Safe sorting
  const sortedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    return [...messages].sort((a, b) => {
      const aTime = a?.timestamp;
      const bTime = b?.timestamp;

      const aTimestamp = aTime
        ? aTime.seconds + (aTime.nanoseconds || 0) / 1e9
        : 0;

      const bTimestamp = bTime
        ? bTime.seconds + (bTime.nanoseconds || 0) / 1e9
        : 0;

      return aTimestamp - bTimestamp;
    });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMessage = {
      sender: senderEmail,
      text: messageText,
      timestamp: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
    };

    sendMessage(messageText, chatId, auth?.currentUser?.uid, selectedUser?.uid);

    // Local UI update
    setMessages((prev) => [...prev, newMessage]);
    sendMessageText("");
  };

  return (
    <>
      {selectedUser ? (
        <section className="flex flex-col items-start justify-start h-screen w-full background-image">
          
          {/* HEADER */}
          <header className="border-b border-gray-400 w-full h-[82px] p-4 bg-white">
            <main className="flex items-center gap-3">

              {/* 🔙 Mobile Back Button */}
              <button
                className="lg:hidden text-teal-600 font-bold mr-2"
                onClick={() => setSelectedUser(null)}
              >
                ← Back
              </button>

              <img
                src={selectedUser?.image || uncleBobby}
                className="w-11 h-11 object-cover rounded-full"
                alt=""
              />

              <span>
                <h3 className="font-semibold text-[#2A3D39] text-lg">
                  {selectedUser?.fullName || "Chatfrik User"}
                </h3>
                <p className="font-light text-[#2A3D39] text-sm">
                  @{selectedUser?.username || "chatfrik"}
                </p>
              </span>
            </main>
          </header>

          {/* CHAT BODY */}
          <main className="custom-scrollbar relative h-full w-full flex flex-col justify-between">
            <section className="px-3 pt-5 pb-20">
              <div ref={scrollRef} className="overflow-auto h-[80vh]">
                {sortedMessages.map((msg, index) => (
                  <div key={index}>
                    {msg?.sender === senderEmail ? (
                      <div className="flex flex-col items-end w-full">
                        <span className="flex gap-3 me-10 h-auto">
                          <div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <h4>{msg.text}</h4>
                            </div>
                            <p className="text-gray-400 text-xs mt-2 text-right">
                              {formatTimestamp(msg?.timestamp)}
                            </p>
                          </div>
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start w-full">
                        <span className="flex gap-3 w-[70%] h-auto ms-4">
                          <img
                            src={uncleBobby}
                            className="h-10 w-10 object-cover rounded-full"
                            alt=""
                          />
                          <div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <h4>{msg.text}</h4>
                            </div>
                            <p className="text-gray-400 text-xs mt-2">
                              {formatTimestamp(msg?.timestamp)}
                            </p>
                          </div>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* INPUT */}
            <div className="sticky bottom-0 p-3 bg-white">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center h-[45px] w-full px-2 rounded-lg relative shadow-lg border"
              >
                <input
                  value={messageText}
                  onChange={(e) => sendMessageText(e.target.value)}
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
          </main>
        </section>
      ) : (
        <section className="h-screen w-full bg-[#e5f6f3]">
          <div className="flex flex-col justify-center items-center h-full">
            <img src={logo} alt="" width={100} />
            <h1 className="text-[30px] font-bold text-teal-700 mt-5">
              Welcome to ChatKaro
            </h1>
            <p className="text-gray-700">
              Connect and chat with your friends and family.
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default Chatbox;
