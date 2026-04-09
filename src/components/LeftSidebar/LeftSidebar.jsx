import React, { useState, useContext, useEffect } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, where, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const LeftSidebar = () => {

  const navigate = useNavigate();
  const { userData, chatData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const inputHandler = async (e) => {
    try {
      const value = e.target.value.toLowerCase();

      if (value) {
        setShowSearch(true);

        const userRef = collection(db, 'users');
        const q = query(userRef, where('username', '==', value));
        const querySnap = await getDocs(q);

        if (
          !querySnap.empty &&
          userData &&
          querySnap.docs[0].data().id !== userData.id
        ) {

          let userExist = false;

          (chatData || []).forEach((item) => {
            if (item.rId === querySnap.docs[0].data().id) {
              userExist = true;
            }
          });

          if (!userExist) {
            setUser(querySnap.docs[0].data());
          } else {
            setUser(null);
          }

        } else {
          setUser(null);
        }

      } else {
        setShowSearch(false);
        setUser(null);
      }

    } catch (error) {
      console.error(error);
    }
  }

  const addChat = async () => {
    try {
      const existingChat = (chatData || []).find(
        (item) => item.rId === user.id
      );

      if (existingChat) {
        setMessagesId(existingChat.messageId);
        setChatUser(existingChat);
        return;
      }

      const messageRef = collection(db, 'messages');
      const chatRef = collection(db, 'chats');

      const newMessage = doc(messageRef);

      await setDoc(newMessage, {
        createdAt: serverTimestamp(),
        messages: []
      });

      await updateDoc(doc(chatRef, userData.id), {
        chatData: arrayUnion({
          messageId: newMessage.id,
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageSeen: true
        })
      });

      await updateDoc(doc(chatRef, user.id), {
        chatData: arrayUnion({
          messageId: newMessage.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: true
        })
      });

      // ✅ FIX
      setChatUser({
        rId: user.id,
        userData: user
      });

      setMessagesId(newMessage.id);
      setShowSearch(false);
      setChatVisible(true);

    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  }

  // ✅ FIXED useEffect
  useEffect(() => {
    const fetchUser = async () => {
      if (chatUser?.rId) {
        const userRef = doc(db, 'users', chatUser.rId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        setChatUser((prev) => ({ ...prev, userData }));
      }
    };

    fetchUser();
  }, [chatUser?.rId]);

  const setChat = async (item) => {
    try {
      setMessagesId(item.messageId);
      setChatUser(item);

      const userchatsRef = doc(db, 'chats', userData.id);
      const userChatsSnapshot = await getDoc(userchatsRef);
      const userChatsData = userChatsSnapshot.data();

      const chatIndex = (userChatsData.chatData || []).findIndex(
        (c) => c.messageId === item.messageId
      );

      if (chatIndex !== -1) {
        userChatsData.chatData[chatIndex].messageSeen = true;
      }

      await setDoc(userchatsRef, {
        chatData: userChatsData.chatData
      }, { merge: true });

      setChatVisible(true);

    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className='ls-top'>
        <div className='ls-nav'>
          <img src={assets.logo} className='logo' alt='' />
          <div className='menu'>
            <img src={assets.menu_icon} alt='' />
            <div className='sub-menu'>
              <p onClick={() => navigate('/profile')}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt='' />
          <input onChange={inputHandler} type='text' placeholder='Search here..' />
        </div>
      </div>

      <div className="ls-list">
        {showSearch && user ?
          <div onClick={addChat} className="friends add-user">
            <img src={user.avatar} alt='' />
            <p>{user.name}</p>
          </div>
          : (chatData || []).map((item, index) => (
            <div
              onClick={() => setChat(item)}
              key={index}
              className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}
            >
              <img src={item.userData?.avatar || assets.profile_img} alt='' />
              <div>
                <p>{item.userData?.name}</p>
                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default LeftSidebar;