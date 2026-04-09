import React, { useEffect, useState, useContext } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const ProfileUpdate = () => {

  const navigate = useNavigate();
  const [image,setImage] = useState(false); // UI ke liye rakha
  const [name,setName] = useState('');
  const [bio,setBio] = useState('');
  const [uid, setUid] = useState('');
  const [prevImage, setPrevImage] = useState('');
  const {setUserData} = useContext(AppContext);

  const profileUpdate = async(e) => {
    e.preventDefault();

    try {
      if(!uid){
        toast.error("User not loaded");
        return;
      }

      const docRef = doc(db, 'users', uid);

      // ❌ upload(image) hata diya
      // ✅ sirf existing avatar ya empty save karenge
      await updateDoc(docRef, {
        name: name,
        bio: bio,
        avatar: prevImage || ""   // UI ke liye
      });

      const snap = await getDoc(docRef);
      setUserData(snap.data());

      navigate('/chat');

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);

        const docRef = doc(db, 'users', user.uid);
        const docSnap =  await getDoc(docRef);
        const data = docSnap.data();

        if(data?.name){
          setName(data.name);
        }
        if(data?.bio){
          setBio(data.bio);
        }
        if(data?.avatar){
          setPrevImage(data.avatar);
        }

      } else {
        navigate('/'); 
      }
    })

    return () => unsubscribe();
  }, [])

  return (
    <div className='profile'>
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>

          {/* ✅ UI same, bas upload kaam nahi karega */}
          <label htmlFor='avatar'>
            <input 
              onChange={(e)=>setImage(e.target.files[0])} 
              type='file' 
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
            />
            <img 
              src={image ? URL.createObjectURL(image) : (prevImage || assets.avatar_icon)} 
              alt=''
            />
            upload profile image
          </label>

          <input 
            onChange={(e)=>setName(e.target.value)} 
            value={name} 
            type='text' 
            placeholder='Your name' 
            required
          />

          <textarea 
            onChange={(e)=>setBio(e.target.value)} 
            value={bio} 
            placeholder='Write profile bio' 
            required
          ></textarea>

          <button type='submit'>Save</button>
        </form>

        <img className='profile-pic' src={image ? URL.createObjectURL(image) : prevImage ? prevImage : assets.logo_icon} alt='' />
      </div>
    </div>
  )
}

export default ProfileUpdate