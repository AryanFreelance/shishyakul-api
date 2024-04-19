import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../db/index.js";

const feesResolver = {
  Query: {
    fees: async () => {
      const fees = [];
      const feesCollection = collection(db, "fees");
      const feesSnapshot = await getDocs(feesCollection);
      feesSnapshot.forEach((doc) => {
        console.log(doc.data());
        fees.push(doc.data());
      });
      return fees;
    },
    fee: (_, { id }) => {
      return fees.find((fee) => fee.createdAt === id);
    },
    studFees: (_, { userId }) => {
      return fees.filter((fee) => fee.userId === userId);
    },
  },
  Mutation: {
    createFee: async (_, { userId, email, feesPaid, paidOn, month, year }) => {
      let today = new Date();
      let id = `${today.getFullYear()}${
        today.getHours() < 10 ? "0" + today.getHours() : today.getHours()
      }${
        today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes()
      }${
        today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds()
      }`;
      const fee = {
        userId,
        id,
        email,
        feesPaid,
        paidOn,
        month,
        year,
        createdAt: new Date().toLocaleString(),
      };
      console.log(fee);
      // await setDoc(doc(db, "fees", fee.userId, ), { ...fee });
      await setDoc(doc(db, "fees", fee.userId, "fee", fee.id), { ...fee });
      return fee;
    },
    deleteFee: async (_, { userId, id }) => {
      let message = {};
      await deleteDoc(doc(db, "fees", userId, "fee", id))
        .then(() => {
          console.log("Document deleted with ID: ", id);
          message = {
            success: true,
            message: "Document deleted with ID",
          };
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
          message = { success: false, message: "Error deleting document" };
        });

      return message;
    },
    deleteUserFees: async (_, { userId }) => {
      let message = {};
      await deleteDoc(doc(db, "fees", userId))
        .then(() => {
          console.log("Document deleted with ID: ", userId);
          message = {
            success: true,
            message: "Document deleted with ID",
          };
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
          message = { success: false, message: "Error deleting document" };
        });

      return message;
    },
  },
};

export default feesResolver;
