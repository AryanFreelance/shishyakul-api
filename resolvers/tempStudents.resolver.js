// REJECTED

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../db/index.js";

const tempStudentResolver = {
  Query: {
    tempStudents: async () => {
      const tempstudents = [];
      const tempstudentsCollection = collection(db, "tempstudents");
      const tempstudentsSnapshot = await getDocs(tempstudentsCollection);
      tempstudentsSnapshot.forEach((doc) => {
        // console.log(doc.data());
        tempstudents.push(doc.data());
      });
      return tempstudents;
    },
    tempStudent: async (_, { email }) => {
      const tempstudent = await getDoc(doc(db, "tempstudents", email));
      return tempstudent.data();
    },
  },
  Mutation: {
    createTempStudent: async (_, { email, verificationCode }) => {
      let message = {};
      const tempstudent = {
        email,
        verificationCode,
      };
      await setDoc(doc(db, "tempstudents", tempstudent.email), {
        ...tempstudent,
      })
        .then(() => {
          // console.log("Document written with ID: ", tempstudent.email);
          message = {
            success: true,
            message: "Document written with ID",
          };
        })
        .catch((error) => {
          // console.error("Error adding document: ", error);
          message = { success: false, message: "Error adding document" };
        });

      // console.log(tempstudent);
      return message;
    },
    deleteTempStudent: async (_, { email }) => {
      const tempstudent = await getDoc(doc(db, "tempstudents", email));

      await deleteDoc(doc(db, "tempstudents", email)).catch((error) => {
        // console.log("Error deleting document: ", error);
        return "ERROR";
      });

      await deleteDoc(
        doc(db, "verifications", tempstudent.data().verificationCode)
      ).catch((error) => {
        // console.log("Error deleting document: ", error);
        return "ERROR";
      });

      return "SUCCESS";
    },

    bulkDeleteTempStudents: async (_, { emails }) => {
      emails.forEach(async (email) => {
        const tempstudent = await getDoc(doc(db, "tempstudents", email));
        console.log("TEMPDATA", tempstudent.data());

        await deleteDoc(doc(db, "tempstudents", email)).catch((error) => {
          console.log("Error deleting document: ", error);
          return "ERROR";
        });

        await deleteDoc(
          doc(db, "verifications", tempstudent.data().verificationCode)
        ).catch((error) => {
          console.log("Error deleting document: ", error);
          return "ERROR";
        });
      });
      console.log("SUCCESS");
      return "SUCCESS";
    },
  },
};

export default tempStudentResolver;
