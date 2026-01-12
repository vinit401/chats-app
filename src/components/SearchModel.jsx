import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { RiSearchLine } from "react-icons/ri";
import { collection, query, where, getDocs } from "firebase/firestore";
import uncleBobby from "../../public/assets/default.jpg";
import { db } from "../firebase/firebase";

const SearchModel = ({ startChat }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [SearchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSearch = async () => {
    if (!SearchTerm.trim()) {
      alert("Plese enter a search terms");
      return;
    }

    try {
      const normalizedSearchTerm = SearchTerm.toLowerCase();
      const q = query(
        collection(db, "user"),
        where("username", ">=", normalizedSearchTerm),
        where("username", "<=", normalizedSearchTerm + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const foundUsers = [];

      querySnapshot.forEach((doc) => {
        foundUsers.push(doc.data());
      });
      setUsers(foundUsers);

      if (foundUsers.length === 0) {
        alert("No users faound");
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log(users);

  // ESC key close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div>
      {/* Open Button */}
      <button
        onClick={openModal}
        className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg"
      >
        <RiSearchLine color="#01AA85" className="w-[18px] h-[18px]" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-center items-center bg-[#00170c66] backdrop-blur-[2px] animate-glassFadeSoft"
          onClick={closeModal}
        >
          <div
            className="relative p-4 w-full max-w-md max-h-full animate-premiumPop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#01AA85] w-full rounded-lg shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-300">
                <h3 className="text-xl font-semibold text-white">
                  Search Chat
                </h3>

                <button
                  onClick={closeModal}
                  className="text-white bg-transparent hover:bg-[#d9f2ed] hover:text-[#01AA85] rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center transition-all"
                >
                  <FaXmark size={25} />
                </button>
              </div>

              <div className="p-4 md:p-5">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search user..."
                      className="border bg-white border-gray-300 text-gray-900 text-sm rounded-lg outline-none w-full p-2.5"
                    />
                    <button
                      onClick={handleSearch}
                      className="bg-green-900 text-white px-3 py-2 rounded-lg hover:bg-green-800 transition"
                    >
                      <FaSearch />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  {users?.map((user) => (
                    <div
                      onClick={() => {
                        console.log(user);
                        startChat(user);
                        closeModal();
                      }}
                      className="flex items-start gap-3 bg-[#15eabc34] p-2 mb-3 rounded-lg cursor-pointer border border-[#ffffff20] shadow-lg hover:scale-[1.02] transition"
                    >
                      <img
                        src={user?.image || uncleBobby}
                        className="h-[40px] w-[40px] rounded-full"
                        alt=""
                      />
                      <span>
                        <h2 className="p-0 font-semibold text-white text-[18px]">
                          {user?.fullName}
                        </h2>
                        <p className="text-[13px] text-white font-extralight">
                          @{user?.username}
                        </p>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchModel;
