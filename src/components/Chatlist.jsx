import React, { useEffect, useMemo, useState } from "react";
import uncleBobby from "../../public/assets/default.jpg";
import { RiMore2Fill } from "react-icons/ri";
import SearchModel from "./SearchModel";
import { formatTimestamp } from "../utils/formateTimestamp";
import { auth, db, listenForChats, listenToUserStatus } from "../firebase/firebase";
import { useDarkMode } from "../context/DarkModeContext";
import { doc, onSnapshot } from "firebase/firestore";

const UserAvatar = ({ user }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenToUserStatus(user.uid, (data) => {
      setStatus(data?.status || "offline");
    });
    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  return (
    <div className="relative flex-shrink-0">
      <img
        src={user?.image || uncleBobby}
        className="h-[42px] w-[42px] rounded-full object-cover"
        alt=""
      />
      {status !== null && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            status === "online" ? "bg-green-400" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
};

const Chatlist = ({ setSelectedUser }) => {
  const { darkMode } = useDarkMode();
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth?.currentUser?.uid) return;
    const userDocRef = doc(db, "user", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      setUser(docSnap.data());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = listenForChats(setChats);
    return () => unsubscribe();
  }, []);

  const sortedChats = useMemo(() => {
    if (!chats || chats.length === 0) return [];
    return [...chats].sort((a, b) => {
      const aTime = a?.lastMessageTimestamp;
      const bTime = b?.lastMessageTimestamp;
      const aT = aTime ? aTime.seconds + (aTime.nanoseconds || 0) / 1e9 : 0;
      const bT = bTime ? bTime.seconds + (bTime.nanoseconds || 0) / 1e9 : 0;
      return bT - aT;
    });
  }, [chats]);

  const startChat = (user) => setSelectedUser(user);

  return (
    <section className={`flex flex-col h-full w-full overflow-hidden ${darkMode ? "bg-[#1a2520]" : "bg-white"}`}>

      {/* TOP HEADER */}
      <header className={`flex items-center justify-between w-full border-b p-4 flex-shrink-0 z-[100] ${darkMode ? "bg-[#1a2520] border-white/10" : "bg-white border-[#898989b9]"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={user?.image || uncleBobby}
              className="w-[44px] h-[44px] object-cover rounded-full"
              alt=""
            />
            {/* Current user always online */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-400" />
          </div>
          <div className="min-w-0">
            <h3 className={`font-semibold text-[17px] truncate ${darkMode ? "text-white" : "text-[#2A3D39]"}`}>
              {user?.fullName || "Chatfrik User"}
            </h3>
            <p className={`font-light text-[15px] truncate ${darkMode ? "text-gray-400" : "text-[#2A3D39]"}`}>
              @{user?.username || "chatfrik"}
            </p>
          </div>
        </div>

        <button className="bg-[#D9F2ED] w-[35px] h-[35px] flex items-center justify-center rounded-lg flex-shrink-0">
          <RiMore2Fill color="#01AA85" size={22} />
        </button>
      </header>

      {/* MESSAGE HEADER */}
      <div className="w-full mt-3 px-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className={`text-[16px] font-medium ${darkMode ? "text-white" : "text-[#2A3D39]"}`}>
            Messages ({chats.length})
          </h3>
          <SearchModel startChat={startChat} />
        </div>
      </div>

      {/* CHAT LIST */}
      <main className="flex flex-col mt-4 flex-1 overflow-y-auto min-h-0 pb-3">
        {sortedChats.map((chat) => {
          const otherUser = chat.users.find(
            (u) => u.email !== auth?.currentUser?.email
          );
          if (!otherUser) return null;

          return (
            <button
              key={chat.id}
              className={`flex items-center w-full border-b px-5 py-3 transition flex-shrink-0 ${
                darkMode
                  ? "border-white/5 hover:bg-white/5"
                  : "border-[#9090902c] hover:bg-[#f5f5f5]"
              }`}
              onClick={() => startChat(otherUser)}
            >
              <UserAvatar user={otherUser} />

              <div className="min-w-0 flex-1 ml-3 text-left">
                <h2 className={`font-semibold text-[16px] truncate ${darkMode ? "text-white" : "text-[#2A3d39]"}`}>
                  {otherUser.fullName}
                </h2>
                <p className={`font-light text-[14px] truncate ${darkMode ? "text-gray-400" : "text-[#2A3d39]"}`}>
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>

              <p className={`ml-3 whitespace-nowrap text-[11px] flex-shrink-0 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                {formatTimestamp(chat?.lastMessageTimestamp)}
              </p>
            </button>
          );
        })}
      </main>
    </section>
  );
};

export default Chatlist;