import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db, storage } from "../db/index.js";
import { deleteObject, ref } from "firebase/storage";

const feesResolver = {
  Query: {
    fees: async () => {
      const fees = [];
      const feesCollection = collection(db, "fees");
      const feesSnapshot = await getDocs(feesCollection);
      feesSnapshot.forEach((doc) => {
        // console.log(doc.data());
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
      // console.log(fee);
      await setDoc(doc(db, "fees", fee.userId, "fee", fee.id), { ...fee })
        .then(() => {
          // console.log("Document written with ID: ", fee.id);
        })
        .catch((error) => {
          // console.error("Error adding document: ", error);
          return "ERROR";
        });
      return "SUCCESS";
    },
    deleteFee: async (_, { userId, id }) => {
      let pdfId = "";
      let mode = "";
      await getDoc(doc(db, "fees", userId, "fee", id))
        .then((doc) => {
          if (doc.exists()) {
            mode = doc.data().mode;
            pdfId =
              doc.data().mode !== "cash" &&
              (doc.data().mode === "cheque"
                ? doc.data().chequeImgUrl
                : doc.data().upiImgUrl);
          }
        })
        .catch((error) => {
          // console.log("Error getting document:", error);
          return "ERROR";
        });
      if (mode !== "cash") {
        pdfId = pdfId
          .split("/")
          [pdfId.split("/").length - 1].split("?")[0]
          .substring(6, 16);

        await deleteObject(ref(storage, `fee/${pdfId}`))
          .then(() => {
            // console.log("File deleted successfully");
          })
          .catch((error) => {
            // console.error("Error deleting file: ", error);
            return "ERROR";
          });
      }

      // Delete Fee File
      // mode !== "cash" &&
      //   ();

      // Delete Fee Document
      await deleteDoc(doc(db, "fees", userId, "fee", id))
        .then(() => {
          // console.log("Document deleted with ID: ", id);
        })
        .catch((error) => {
          // console.error("Error deleting document: ", error);
          return "ERROR";
        });

      return "SUCCESS";
    },
  },
};

export default feesResolver;
