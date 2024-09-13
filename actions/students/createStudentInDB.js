import { ref, set } from "firebase/database";
import { database } from "../../db";

const createStudentInDB = () => {
  set(ref(database, "users/" + userId), {
    username: name,
    email: email,
    profile_picture: imageUrl,
  });
};
