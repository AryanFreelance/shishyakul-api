import {
  collection,
  deleteDoc,
  doc,
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
  },
  Mutation: {
    createFee: async (
      _,
      {
        userId,
        email,
        feesPaid,
        paidOn,
        month,
        year,
        mode,
        chequeRefNo,
        upiId,
        referenceImgUrl,
      }
    ) => {
      let today = new Date();
      let id = `${today.getFullYear()}${
        today.getHours() < 10 ? "0" + today.getHours() : today.getHours()
      }${
        today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes()
      }${
        today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds()
      }`;
      // const fee = {
      //   userId,
      //   id,
      //   email,
      //   feesPaid,
      //   paidOn,
      //   month,
      //   year,
      //   createdAt: new Date().toLocaleString(),
      // };
      let fee = {};
      if (mode === "cash") {
        fee = {
          userId,
          id,
          email,
          feesPaid,
          paidOn,
          month,
          year,
          createdAt: new Date().toLocaleString(),
        };
      } else if (mode === "cheque") {
        fee = {
          userId,
          id,
          email,
          feesPaid,
          paidOn,
          month,
          year,
          mode,
          chequeRefNo,
          referenceImgUrl,
          createdAt: new Date().toLocaleString(),
        };
      } else if (mode === "upi") {
        fee = {
          userId,
          id,
          email,
          feesPaid,
          paidOn,
          month,
          year,
          mode,
          upiId,
          referenceImgUrl,
          createdAt: new Date().toLocaleString(),
        };
      }
      console.log(fee);
      await setDoc(doc(db, "fees", fee.userId, "fee", fee.id), { ...fee })
        .then(() => {
          console.log("Document written with ID: ", fee.id);
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
          return "ERROR";
        });
      return "SUCCESS";
    },
    deleteFee: async (_, { userId, id }) => {
      await deleteDoc(doc(db, "fees", userId, "fee", id))
        .then(() => {
          console.log("Document deleted with ID: ", id);
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
          return "ERROR";
        });

      return "SUCCESS";
    },
  },
};

export default feesResolver;
