import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";

const verificationsResolver = {
  Query: {
    verifications: async () => {
      const verifications = [];
      const verificationsCollection = collection(db, "verifications");
      const verificationsSnapshot = await getDocs(verificationsCollection);
      verificationsSnapshot.forEach((doc) => {
        console.log(doc.data());
        verifications.push(doc.data());
      });
      return verifications;
    },
    verification: async (_, { verificationCode }) => {
      const verification = await getDoc(
        doc(db, "verifications", verificationCode)
      );
      return verification.data();
    },
  },
  Mutation: {
    createVerification: async (_, { studentEmail }) => {
      let message = {};
      const verification = {
        verificationCode: uuidv4(),
        expired: false,
        studentEmail,
      };
      await setDoc(doc(db, "verifications", verification.verificationCode), {
        ...verification,
      })
        .then(() => {
          console.log(
            "Document written with ID: ",
            verification.verificationCode
          );
          message = {
            code: verification.verificationCode,
            success: true,
            message: "Document written with ID",
          };
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
          message = { success: false, message: "Error adding document" };
        });

      console.log(verification);
      return message;
    },
    updateVerification: async (_, { verificationCode, expired }) => {
      let message = {};
      console.log(verificationCode);
      const verification = await getDoc(
        doc(db, "verifications", verificationCode)
      );
      const verificationData = verification.data();
      console.log(verificationData);
      await updateDoc(doc(db, "verifications", verificationCode), {
        ...verificationData,
        expired,
      })
        .then(() => {
          console.log("Document updated with ID: ", verificationCode);
          message = {
            code: verificationCode,
            success: true,
            message: "Document updated with ID",
          };
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
          message = {
            code: verificationCode,
            success: false,
            message: "Error updating document",
          };
        });

      return message;
    },
    verifyStudentCode: async (_, { verificationCode }) => {
      let message = {};
      try {
        const verification = await getDoc(
          doc(db, "verifications", verificationCode)
        );
        const verificationData = verification.data();
        if (verificationData.expired) {
          message = { success: false, message: "Verification code expired" };
        } else if (!verificationData.expired) {
          message = { success: true, message: "Verification code verified" };
        } else {
          message = { success: false, message: "Verification code not found" };
        }
      } catch (error) {
        message = { success: false, message: "Error verifying student" };
        console.log(error);
      }

      return message;
    },
    deleteVerification: async (_, { verificationCode }) => {
      let message = {};
      await deleteDoc(doc(db, "verifications", verificationCode))
        .then(() => {
          console.log("Document deleted with ID: ", verificationCode);
          message = { success: true, message: "Document deleted with ID" };
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
          message = { success: false, message: "Error deleting document" };
        });

      return message;
    },
  },
};

export default verificationsResolver;
