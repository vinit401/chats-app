import React, { useEffect, useState } from "react";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Register from "./components/Register";
import Chatlist from "./components/Chatlist";
import Login from "./components/Login";
import { DarkModeProvider } from "./context/DarkModeContext";
import { auth, setUserOnline, setUserOffline } from "./firebase/firebase";

const App = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await setUserOnline();
      }
    });

    const handleOffline = () => setUserOffline();
    window.addEventListener("beforeunload", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, []);

  if (!user) {
    return (
      <DarkModeProvider>
        <div>
          {isLogin ? (
            <Login isLogin={isLogin} setIsLogin={setIsLogin} />
          ) : (
            <Register isLogin={isLogin} setIsLogin={setIsLogin} />
          )}
        </div>
      </DarkModeProvider>
    );
  }

  return (
    <DarkModeProvider>
      <div className="flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden dark:bg-[#121a18]">
        <Navlinks />

        {/* MOBILE VIEW */}
        <div className="flex w-full flex-1 overflow-hidden lg:hidden">
          {!selectedUser ? (
            <div className="w-full flex flex-col overflow-hidden">
              <Chatlist setSelectedUser={setSelectedUser} />
            </div>
          ) : (
            <div className="w-full flex flex-col overflow-hidden">
              <Chatbox
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
              />
            </div>
          )}
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden lg:flex w-full flex-1 overflow-hidden">
          <div className="flex-shrink-0 w-[350px] xl:w-[400px] flex flex-col overflow-hidden border-r border-gray-200 dark:border-white/10">
            <Chatlist setSelectedUser={setSelectedUser} />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <Chatbox
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
            />
          </div>
        </div>
      </div>
    </DarkModeProvider>
  );
};

export default App;