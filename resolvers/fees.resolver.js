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
        id,
        userId,
        email,
        feesPaid,
        paidOn,
        month,
        year,
        mode,
        chequeRefNo,
        chequeImgUrl,
        upiId,
        upiImgUrl,
      }
    ) => {
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
          mode,
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
          chequeImgUrl,
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
          upiImgUrl,
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
