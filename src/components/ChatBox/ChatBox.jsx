import React, { useContext, useEffect, useState, useRef } from 'react'
import './ChatBox.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { toast } from 'react-toastify'
import upload from '../../lib/upload' 

const ChatBox = () => {
  const chatEndRef = useRef(null);

  const { userData, messagesId, chatUser, messages, setMessages, setChatVisible } = useContext(AppContext) || {};
  
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    try {
      if (input.trim() && messagesId) {
        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: Date.now()
          })
        });

        const receiverId = chatUser?.rId || chatUser?.id;
        const userIDs = [receiverId, userData.id];

        for (const id of userIDs) {
          const userChatRef = doc(db, 'chats', id);
          const userChatsSnapshot = await getDoc(userChatRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatArray = userChatsData.chatData || [];

            const chatIndex = chatArray.findIndex(
              (c) => c.messageId === messagesId
            );

            if (chatIndex !== -1) {
              chatArray[chatIndex].lastMessage = input.slice(0, 30);
              chatArray[chatIndex].updatedAt = Date.now();

              if (chatArray[chatIndex].rId === userData.id) {
                chatArray[chatIndex].messageSeen = false;
              }

              await updateDoc(userChatRef, {
                chatData: chatArray
              });
            }
          }
        }
      }
    } catch (error) {
      toast.error(error.message);
    }

    setInput('');
  }

  const sendImage = async (e) => {
    try {
      const fileUrl = await upload(e.target.files[0]);  

      if (fileUrl && messagesId) {
        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            image: fileUrl,
            createdAt: Date.now()
          })
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const convertTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return hours > 12
      ? `${hours - 12}:${minutes} PM`
      : `${hours}:${minutes} AM`;
  }

  useEffect(() => {
    if (messagesId) {
      const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
        const data = res.data();
        setMessages(data?.messages || []);
      });

      return () => unSub();
    }
  }, [messagesId]);

  // ✅ 🔥 MAIN FIX (AUTO SCROLL)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return chatUser ? (
    <div className="chat-box">

      <div className="chat-user">
        <img
          src={chatUser?.userData?.avatar || chatUser?.avatar || assets.profile_img}
          alt=""
        />

        <p>
          {chatUser?.userData?.name || chatUser?.name || chatUser?.username}

          {chatUser?.userData?.lastSeen &&
           Date.now() - chatUser.userData.lastSeen <= 70000
            ? <img className="dot" src={assets.green_dot} alt="" />
            : null}
        </p>

        <img src={assets.help_icon} className='help' alt='' />

        <img 
          onClick={() => setChatVisible && setChatVisible(false)} 
          src={assets.arrow_icon} 
          className='arrow' 
          alt='' 
        />
      </div>

      <div className="chat-msg">
        {(messages || []).map((msg, index) => (
          <div key={index} className={msg.sId === userData.id ? "s-msg" : "r-msg"}>
            
            {msg.image
              ? <img className='msg-img' src={msg.image} alt="" />
              : <p className='msg'>{msg.text}</p>
            }

            <div>
              <img
                src={
                  msg.sId === userData.id
                    ? userData?.avatar || assets.profile_img
                    : chatUser?.userData?.avatar || assets.profile_img
                }
                alt=""
              />
              <p>{convertTimestamp(msg.createdAt)}</p>
            </div>
          </div>
        ))}

        {/* ✅ scroll anchor */}
        <div ref={chatEndRef}></div>
      </div>

      <div className="chat-input">
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder='Send a message...'
        />

        <input onChange={sendImage} type="file" id='image' hidden />

        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>

        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>

    </div>
  )
  : (
    <div className='chat-welcome'>
      <img src={assets.logo_icon} alt="" />
      <p>chat anytime, anywhere</p>
    </div>
  )
}

export default ChatBox;