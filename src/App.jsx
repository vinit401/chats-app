import React from "react";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Register from "./components/Register";
import SearchModel from "./components/SearchModel";
import Chatlist from "./components/Chatlist";
import Login from "./components/Login";
import { auth } from "./firebase/firebase";
import { useState } from "react";
import { useEffect } from "react";

const App = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {user ? (
        <div className="flex lg:flex-row flex-col items-start w-[100%]">
          <Navlinks />
          <Chatlist setSelectedUser={setSelectedUser} />
          <Chatbox selectedUser={selectedUser} />
        </div>
      ) : (
        <div>
          {isLogin ? (
            <Login isLogin={isLogin} setIsLogin={setIsLogin} />
          ) : (
            <Register isLogin={isLogin} setIsLogin={setIsLogin} />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
