import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXrEv6PZ4NYFbqSQRyinA4d40LBHHj5Vo",
  authDomain: "shishyakul-699f2.firebaseapp.com",
  databaseURL:
    "https://shishyakul-699f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shishyakul-699f2",
  storageBucket: "shishyakul-699f2.appspot.com",
  messagingSenderId: "666950754196",
  appId: "1:666950754196:web:40eca28d6a30026e787981",
  measurementId: "G-29SKYTZTBN",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
