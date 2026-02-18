import React from "react";
import { signOut } from "firebase/auth";
import { auth, setUserOffline } from "../firebase/firebase";
import logo from "../../public/assets/logo.png";
import {
  RiChatAiLine,
  RiFile4Line,
  RiFolderUserLine,
  RiBardLine,
  RiNotificationLine,
  RiShutDownLine,
} from "react-icons/ri";

const Navlinks = () => {
  const handleLogout = async () => {
    try {
      await setUserOffline(); // set status to offline before signing out
      await signOut(auth);
      alert("Logout successful");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="flex-shrink-0 flex lg:flex-col items-center lg:items-center lg:justify-start h-[60px] lg:h-full w-full lg:w-[70px] bg-[#01AA85] lg:py-4">

      {/* Logo */}
      <div className="flex items-center justify-center lg:border-b border-[#ffffffb9] lg:w-full p-3 lg:pb-4 lg:mb-4 flex-shrink-0">
        <img
          src={logo}
          className="w-[36px] h-[36px] lg:w-[44px] lg:h-[44px] object-contain bg-white rounded-lg p-1.5"
          alt="logo"
        />
      </div>

      {/* Nav links */}
      <ul className="flex lg:flex-col flex-row items-center gap-5 lg:gap-8 px-3 lg:px-0 flex-1 lg:flex-none lg:mt-2">
        <li>
          <button className="text-[22px] lg:text-[26px] cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <RiChatAiLine color="#fff" />
          </button>
        </li>
        <li>
          <button className="text-[22px] lg:text-[26px] cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <RiFolderUserLine color="#fff" />
          </button>
        </li>
        <li>
          <button className="text-[22px] lg:text-[26px] cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <RiNotificationLine color="#fff" />
          </button>
        </li>
        <li>
          <button className="text-[22px] lg:text-[26px] cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <RiFile4Line color="#fff" />
          </button>
        </li>
        <li>
          <button className="text-[22px] lg:text-[26px] cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <RiBardLine color="#fff" />
          </button>
        </li>
      </ul>

      {/* Logout — pushed to end */}
      <div className="flex items-center justify-center p-3 lg:mt-auto">
        <button
          onClick={handleLogout}
          className="text-[22px] lg:text-[26px] cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Logout"
        >
          <RiShutDownLine color="#fff" />
        </button>
      </div>
    </section>
  );
};

export default Navlinks;