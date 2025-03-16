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
    studentFees: async (_, { userId, academicYear }) => {
      try {
        const studentFees = [];
        const feeCollection = academicYear ? academicYear.replace("-", "_") : "current";
        const feesCollection = collection(db, "fees", userId, feeCollection);
        const feesSnapshot = await getDocs(feesCollection);

        feesSnapshot.forEach((doc) => {
          studentFees.push(doc.data());
        });

        return studentFees;
      } catch (error) {
        console.error("Error fetching student fees:", error);
        return [];
      }
    },
    studentAllFees: async (_, { userId }) => {
      try {
        const studentFees = [];
        const userFeesDoc = await getDoc(doc(db, "fees", userId));

        if (userFeesDoc.exists()) {
          // Get all subcollections
          const collections = await getDocs(collection(db, "fees", userId));

          // For each academic year collection
          for (const collectionRef of collections) {
            const academicYearFees = await getDocs(collection(db, "fees", userId, collectionRef.id));
            academicYearFees.forEach((feeDoc) => {
              studentFees.push(feeDoc.data());
            });
          }
        }

        return studentFees;
      } catch (error) {
        console.error("Error fetching all student fees:", error);
        return [];
      }
    }
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
        academicYear,
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

      // Store fees by academic year
      const feeCollection = academicYear ? academicYear.replace("-", "_") : "current";

      await setDoc(doc(db, "fees", fee.userId, feeCollection, fee.id), { ...fee, academicYear })
        .then(() => {
          // console.log("Document written with ID: ", fee.id);
        })
        .catch((error) => {
          // console.error("Error adding document: ", error);
          return "ERROR";
        });
      return "SUCCESS";
    },
    updateFee: async (_, { id, userId, remark, academicYear }) => {
      const feeCollection = academicYear ? academicYear.replace("-", "_") : "current";

      await updateDoc(doc(db, "fees", userId, feeCollection, id), {
        remark,
      }).catch((error) => {
        console.error("Error adding document: ", error);
        return "ERROR";
      });

      return "SUCCESS";
    },
    updateStudentTotalFees: async (_, { userId, totalFees, academicYear }, context) => {
      try {
        const studentData = await getDoc(doc(db, "studs", userId));
        if (studentData.exists()) {
          const ay = academicYear || studentData.data().ay;
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
    deleteFee: async (_, { userId, id, academicYear }) => {
      const feeCollection = academicYear ? academicYear.replace("-", "_") : "current";

      let pdfId = "";
      let mode = "";
      await getDoc(doc(db, "fees", userId, feeCollection, id))
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
      await deleteDoc(doc(db, "fees", userId, feeCollection, id))
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
