import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, database } from "../db/index.js";
import deleteObjectFromStorage from "../actions/storage/deleteObjectFromStorage.js";
import { ref, set, update } from "firebase/database";

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
        neftRefNo,
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
      } else if (mode === "neft") {
        fee = {
          userId,
          id,
          email,
          feesPaid,
          paidOn,
          month,
          year,
          mode,
          neftRefNo,
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
    updateFee: async (_, { id, userId, remark }) => {
      // await setDoc(doc(db, "fees", userId, "fee", id), {
      //   id,
      //   userId,
      //   remark,
      // })
      //   .then(() => {
      //     // console.log("Document written with ID: ", id);
      //   })
      //   .catch((error) => {
      //     // console.error("Error adding document: ", error);
      //     return "ERROR";
      //   });

      // Set the "capital" field of the city 'DC'
      await updateDoc(doc(db, "fees", userId, "fee", id), {
        remark,
      }).catch((error) => {
        console.error("Error adding document: ", error);
        return "ERROR";
      });

      return "SUCCESS";
    },
    updateStudentTotalFees: async (_, { userId, totalFees }, context) => {
      try {
        // Get a reference to the student document
        // Update the totalFees field
        console.log(userId, totalFees);
        // await updateDoc(doc(database, "students", userId), {
        //   totalFees,
        // }).catch((error) => {
        //   console.error("Error adding document: ", error);
        //   return false;
        // });
        const studentData = await getDoc(doc(db, "studs", userId));
        if (studentData.exists()) {
          const ay = studentData.data().ay;
          const grade = studentData.data().grade;
          await update(ref(database, "studs/" + ay + "/" + grade + "/" + userId), {
            totalFees,
          }).catch((error) => {
            console.error("Error updating document: ", error);
            return false;
          });
          console.log("Student total fees updated successfully");
        } else {
          console.log("Student data not found");
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error updating student total fees:', error);
        return false;
      }
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
      if (mode !== "cash" && mode !== "neft") {
        pdfId = pdfId
          .split("/")
        [pdfId.split("/").length - 1].split("?")[0]
          .substring(6, 16);

        if (!deleteObjectFromStorage(`fee/${pdfId}`)) {
          return "ERROR";
        }
      }

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
