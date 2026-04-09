import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { collection, doc, getDocs, getFirestore, setDoc,query, where } from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyDGBPWvbOhH6PPsvjbo01jBs6Houezi_TY",
  authDomain: "chat-app-b53f4.firebaseapp.com",
  projectId: "chat-app-b53f4",
  storageBucket: "chat-app-b53f4.appspot.com",
  messagingSenderId: "295779441733",
  appId: "1:295779441733:web:f758ba3eee2e5701bf572c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔥 SIGNUP
const signup = async (username, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email,
      name: "",
      avatar: "",
      bio: "Hey, I am using Chat App",
      lastSeen: Date.now()
    });

    // ✅ FIX HERE (chatsData → chatData)
    await setDoc(doc(db, "chats", user.uid), {
      chatData: []
    });

    toast.success("Account created successfully ✅");

  } catch (error) {
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(' '));
  }
};

// 🔥 LOGIN
const login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    toast.success("Login successful ✅");
  } catch (error) {
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(' '));
  }
}

// 🔥 LOGOUT
const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(' '));
  }
}

const resetPass = async (email) => {
  if (!email) {
    toast.error("Please enter your email");
    return null;
  }
  try {
    const userRef = collection(db, 'users');
    const q = query(userRef, where("email", "==", email));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset Email Sent")
    }
    else {
      toast.error("Email not found");
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message)
  }
}

export { signup, login, logout, auth, db, resetPass };