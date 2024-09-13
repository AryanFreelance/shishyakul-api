import { deleteObject, ref } from "firebase/storage";
import { storage } from "../../db/index.js";

const deleteObjectFromStorage = async (reference) => {
  await deleteObject(ref(storage, reference))
    .then(() => {
      return true;
    })
    .catch((error) => {
      console.log("ERROR IN DELETE DOCUMENT", error);
      return false;
    });
};

export default deleteObjectFromStorage;
