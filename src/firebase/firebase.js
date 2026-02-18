import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  doc,
  query,
  where,
  writeBatch,
  getDocs,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCB8SgaQrn6I_6Vv0aUQ2dfnhtcgOdJFwI",
  authDomain: "chat-app-2e349.firebaseapp.com",
  projectId: "chat-app-2e349",
  storageBucket: "chat-app-2e349.firebasestorage.app",
  messagingSenderId: "197252439609",
  appId: "1:197252439609:web:e07ab651f4bcee6ff377e8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─────────────────────────────────────────────
// ONLINE / OFFLINE STATUS
// ─────────────────────────────────────────────

/**
 * Call once after login. Sets status to "online" in Firestore
 * and registers an onDisconnect-style cleanup using beforeunload.
 */
export const setUserOnline = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const userRef = doc(db, "user", uid);
  await updateDoc(userRef, {
    status: "online",
    lastSeen: serverTimestamp(),
  });

  // Mark offline when tab/window closes
  const handleOffline = () => setUserOffline();
  window.addEventListener("beforeunload", handleOffline);

  return () => window.removeEventListener("beforeunload", handleOffline);
};

export const setUserOffline = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const userRef = doc(db, "user", uid);
  await updateDoc(userRef, {
    status: "offline",
    lastSeen: serverTimestamp(),
  });
};

/**
 * Listen to a specific user's online status.
 * Returns an unsubscribe function.
 */
export const listenToUserStatus = (uid, callback) => {
  if (!uid) return () => {};
  const userRef = doc(db, "user", uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback({
        status: snap.data().status || "offline",
        lastSeen: snap.data().lastSeen || null,
      });
    }
  });
};

// ─────────────────────────────────────────────
// CHATS
// ─────────────────────────────────────────────

export const listenForChats = (setChats) => {
  const chatRef = collection(db, "chats");

  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    const chatList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const filteredChats = chatList.filter((chat) =>
      chat?.users?.some((user) => user.email === auth.currentUser.email)
    );

    setChats(filteredChats);
  });

  return unsubscribe;
};

// ─────────────────────────────────────────────
// MESSAGES + READ RECEIPTS
// ─────────────────────────────────────────────

export const sendMessage = async (messageText, chatId, user1, user2) => {
  const chatRef = doc(db, "chats", chatId);

  const user1Doc = await getDoc(doc(db, "user", user1));
  const user2Doc = await getDoc(doc(db, "user", user2));

  const user1Data = user1Doc.data();
  const user2Data = user2Doc.data();

  const chatDoc = await getDoc(chatRef);

  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      users: [user1Data, user2Data],
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
    });
  } else {
    await updateDoc(chatRef, {
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
    });
  }

  const messageRef = collection(db, "chats", chatId, "messages");

  // readBy: array of uids who have seen this message (sender has already seen it)
  await addDoc(messageRef, {
    text: messageText,
    sender: auth.currentUser.email,
    senderUid: auth.currentUser.uid,
    timestamp: serverTimestamp(),
    readBy: [auth.currentUser.uid],
  });
};

export const listenForMessages = (chatId, setMessages) => {
  const chatRef = collection(db, "chats", chatId, "messages");

  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMessages(messages);
  });

  return unsubscribe;
};

/**
 * Mark all messages in a chat as read by the current user.
 * Call this when the user opens a chat.
 */
export const markMessagesAsRead = async (chatId) => {
  const uid = auth.currentUser?.uid;
  if (!uid || !chatId) return;

  const messagesRef = collection(db, "chats", chatId, "messages");
  const snapshot = await getDocs(messagesRef);

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const readBy = data.readBy || [];
    // Only update if not already read by this user and not sent by this user
    if (!readBy.includes(uid)) {
      batch.update(docSnap.ref, {
        readBy: [...readBy, uid],
      });
    }
  });

  await batch.commit();
};

// ─────────────────────────────────────────────
// TYPING INDICATORS
// ─────────────────────────────────────────────

/**
 * Update typing status in Firestore under chats/{chatId}/typing/{uid}
 */
export const setTypingStatus = async (chatId, isTyping) => {
  const uid = auth.currentUser?.uid;
  if (!uid || !chatId) return;

  const typingRef = doc(db, "chats", chatId, "typing", uid);
  await setDoc(typingRef, {
    isTyping,
    uid,
    email: auth.currentUser.email,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Listen for typing status of the OTHER user in the chat.
 */
export const listenForTyping = (chatId, otherUserUid, callback) => {
  if (!chatId || !otherUserUid) return () => {};

  const typingRef = doc(db, "chats", chatId, "typing", otherUserUid);

  return onSnapshot(typingRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data().isTyping === true);
    } else {
      callback(false);
    }
  });
};

export { auth, db };