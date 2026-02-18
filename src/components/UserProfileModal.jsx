import React from "react";
import { FaXmark } from "react-icons/fa6";
import { RiMailLine, RiUser3Line } from "react-icons/ri";
import uncleBobby from "../../public/assets/default.jpg";
import { useDarkMode } from "../context/DarkModeContext";

const UserProfileModal = ({ user, onClose }) => {
  const { darkMode } = useDarkMode();

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-center items-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden animate-premiumPop ${
          darkMode ? "bg-[#1e2a27]" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="h-24 bg-gradient-to-r from-[#01AA85] to-[#00c49a]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition"
        >
          <FaXmark size={18} />
        </button>

        {/* Avatar — overlaps banner */}
        <div className="flex flex-col items-center -mt-12 px-6 pb-6">
          <div className="relative">
            <img
              src={user?.image || uncleBobby}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              alt={user?.fullName}
            />
            {/* Online dot */}
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                user?.status === "online" ? "bg-green-400" : "bg-gray-400"
              }`}
            />
          </div>

          {/* Name */}
          <h2
            className={`mt-3 text-xl font-bold ${
              darkMode ? "text-white" : "text-[#2A3D39]"
            }`}
          >
            {user?.fullName || "ChatKaro User"}
          </h2>

          {/* Status badge */}
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full mt-1 ${
              user?.status === "online"
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {user?.status === "online" ? "🟢 Online" : "⚫ Offline"}
          </span>

          {/* Divider */}
          <div
            className={`w-full h-px my-4 ${
              darkMode ? "bg-white/10" : "bg-gray-100"
            }`}
          />

          {/* Info rows */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#D9F2ED] flex items-center justify-center flex-shrink-0">
                <RiUser3Line color="#01AA85" size={18} />
              </div>
              <div>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  Username
                </p>
                <p
                  className={`font-medium ${
                    darkMode ? "text-white" : "text-[#2A3D39]"
                  }`}
                >
                  @{user?.username || "chatfrik"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#D9F2ED] flex items-center justify-center flex-shrink-0">
                <RiMailLine color="#01AA85" size={18} />
              </div>
              <div>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  Email
                </p>
                <p
                  className={`font-medium truncate max-w-[220px] ${
                    darkMode ? "text-white" : "text-[#2A3D39]"
                  }`}
                >
                  {user?.email || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Message button */}
          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 rounded-xl bg-[#01AA85] text-white font-semibold hover:bg-[#019e7a] transition"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;