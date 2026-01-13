import React, { useEffect, useState } from "react";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Register from "./components/Register";
import Chatlist from "./components/Chatlist";
import Login from "./components/Login";
import { auth } from "./firebase/firebase";

const App = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Not logged in
  if (!user) {
    return (
      <div>
        {isLogin ? (
          <Login isLogin={isLogin} setIsLogin={setIsLogin} />
        ) : (
          <Register isLogin={isLogin} setIsLogin={setIsLogin} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full">
      <Navlinks />

      {/* MOBILE VIEW */}
      <div className="flex w-full h-full lg:hidden">
        {!selectedUser ? (
          <Chatlist setSelectedUser={setSelectedUser} />
        ) : (
          <Chatbox selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
        )}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:flex w-full h-full">
        <Chatlist setSelectedUser={setSelectedUser} />
        <Chatbox selectedUser={selectedUser} setSelectedUser={setSelectedUser} />

        {/* <Chatbox selectedUser={selectedUser} /> */}
      </div>
    </div>
  );
};

export default App;
