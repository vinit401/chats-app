import React, { useEffect, useMemo, useState } from "react";
import uncleBobby from "../../public/assets/default.jpg";
import { RiMore2Fill } from "react-icons/ri";
import SearchModel from "./SearchModel";
import { formatTimestamp } from "../utils/formateTimestamp";
import { auth, db, listenForChats } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const Chatlist = ({ setSelectedUser }) => {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);

  // Current user data
  useEffect(() => {
    if (!auth?.currentUser?.uid) return;

    const userDocRef = doc(db, "user", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      setUser(docSnap.data());
    });

    return () => unsubscribe();
  }, []);

  // Chats listener
  useEffect(() => {
    const unsubscribe = listenForChats(setChats);
    return () => {
      unsubscribe();
    };
  }, []);

  const sortedChats = useMemo(() => {
    if (!chats || chats.length === 0) return [];

    return [...chats].sort((a, b) => {
      const aTime = a?.lastMessageTimestamp;
      const bTime = b?.lastMessageTimestamp;

      const aTimestamp = aTime
        ? aTime.seconds + (aTime.nanoseconds || 0) / 1e9
        : 0;

      const bTimestamp = bTime
        ? bTime.seconds + (bTime.nanoseconds || 0) / 1e9
        : 0;

      return bTimestamp - aTimestamp;
    });
  }, [chats]);

  const startChat = (user) => {
    setSelectedUser(user);
  };

  return (
    /* key fix: h-full + flex flex-col + overflow-hidden on the section */
    <section className="flex flex-col bg-white h-full w-full overflow-hidden">

      {/* TOP HEADER — sticky inside flex column */}
      <header className="flex items-center justify-between w-full border-b border-[#898989b9] p-4 flex-shrink-0 bg-white z-[100]">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={user?.image || uncleBobby}
            className="w-[44px] h-[44px] object-cover rounded-full flex-shrink-0"
            alt=""
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-[#2A3D39] text-[17px] truncate">
              {user?.fullName || "Chatfrik User"}
            </h3>
            <p className="font-light text-[#2A3D39] text-[15px] truncate">
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
          <h3 className="text-[16px] font-medium">Messages ({chats.length})</h3>
          <SearchModel startChat={startChat} />
        </div>
      </div>

      {/* CHAT LIST — key fix: flex-1 + overflow-y-auto + min-h-0 */}
      <main className="flex flex-col mt-4 flex-1 overflow-y-auto min-h-0 pb-3">
        {sortedChats.map((chat) => {
          const otherUser = chat.users.find(
            (u) => u.email !== auth?.currentUser?.email
          );

          if (!otherUser) return null;

          return (
            <button
              key={chat.id}
              className="flex items-start w-full border-b border-[#9090902c] px-5 py-3 hover:bg-[#f5f5f5] transition flex-shrink-0"
              onClick={() => startChat(otherUser)}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <img
                  src={otherUser.image || uncleBobby}
                  className="h-[40px] w-[40px] rounded-full object-cover flex-shrink-0"
                  alt=""
                />

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-[#2A3d39] text-[16px] text-left truncate">
                    {otherUser.fullName}
                  </h2>

                  <p className="font-light text-[#2A3d39] text-[14px] text-left truncate">
                    {chat.lastMessage || "No messages yet"}
                  </p>
                </div>
              </div>

              {/* DATE */}
              <p className="ml-3 whitespace-nowrap text-gray-500 text-[11px] flex-shrink-0 mt-1">
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