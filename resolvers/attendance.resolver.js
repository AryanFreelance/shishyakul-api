import { db } from "../db/index.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
} from "firebase/firestore";

const attendanceResolver = {
  Query: {
    attendances: async () => {
      const attendance = [];
      const attendanceSnapshot = await getDocs(collection(db, "attendance"));
      attendanceSnapshot.forEach((doc) => {
        attendance.push(doc.data());
      });
      console.log(attendance);
      return attendance;
    },
    attendance: async (_, { timestamp }) => {
      const attendance = await getDoc(doc(db, "attendance", timestamp));
      return attendance.data();
    },
  },
  Mutation: {
    createAttendance: async (_, { timestamp, present, absent }) => {
      const attendance = {
        timestamp,
        present,
        absent,
        createdAt: new Date().toLocaleString(),
      };
      console.log(attendance);

      // Check if the attendance has been taken for the day, if yes then show error, else create a new attendance
      const attendanceDoc = doc(db, "attendance", timestamp);
      const attendanceData = await getDoc(attendanceDoc);
      if (attendanceData.exists()) return "EXISTED";

      await setDoc(doc(db, "attendance", attendance.timestamp), attendance)
        .then((docRef) => {
          console.log("Document written with ID: ", docRef);
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
          return "ERROR";
        });

      present.forEach(async (studentId) => {
        const studentDoc = doc(db, "students", studentId);
        const student = await getDoc(studentDoc);

        const studentData = student.data();
        await setDoc(studentDoc, {
          ...studentData,
          attendance: {
            ...studentData.attendance,
            present: studentData.attendance.present + 1,
          },
        });
      });

      absent.forEach(async (studentId) => {
        const studentDoc = doc(db, "students", studentId);
        const student = await getDoc(studentDoc);
        const studentData = student.data();
        await setDoc(studentDoc, {
          ...studentData,
          attendance: {
            ...studentData.attendance,
            absent: studentData.attendance.absent + 1,
          },
        });
      });

      return "SUCCESS";
    },
    updateAttendance: async (_, { timestamp, present, absent }) => {
      const prevData = await getDoc(doc(db, "attendance", timestamp));
      const attendance = {
        ...prevData.data(),
        present,
        absent,
      };
      console.log(attendance);

      const prevAttendance = prevData.data();

      const prevPresent = prevAttendance.present;
      const prevAbsent = prevAttendance.absent;

      const newPresent = present.filter((id) => !prevPresent.includes(id));
      const newAbsent = absent.filter((id) => !prevAbsent.includes(id));

      newPresent.forEach(async (sID) => {
        try {
          await runTransaction(db, async (transaction) => {
            const sDoc = await transaction.get(doc(db, "students", sID));
            if (!sDoc.exists()) {
              throw "Document does not exist!";
            }

            const newPresentData = Number(sDoc.data().attendance.present) + 1;
            const newAbsentData = Number(sDoc.data().attendance.absent) - 1;

            console.log("New Present Data", newPresentData);
            console.log("New Absent Data", newAbsentData);
            transaction.update(doc(db, "students", sID), {
              attendance: {
                present: newPresentData,
                absent: newAbsentData,
              },
            });
          });
          console.log("Transaction successfully committed!");
        } catch (e) {
          console.log("Transaction failed: ", e);
        }
      });

      newAbsent.forEach(async (sID) => {
        try {
          await runTransaction(db, async (transaction) => {
            const sDoc = await transaction.get(doc(db, "students", sID));
            if (!sDoc.exists()) {
              throw "Document does not exist!";
            }

            const newAbsentData = Number(sDoc.data().attendance.absent) + 1;
            const newPresentData = Number(sDoc.data().attendance.present) - 1;

            console.log("New Present Data", newPresentData);
            console.log("New Absent Data", newAbsentData);

            transaction.update(doc(db, "students", sID), {
              attendance: {
                present: newPresentData,
                absent: newAbsentData,
              },
            });
          });
          console.log("Transaction successfully committed!");
        } catch (e) {
          console.log("Transaction failed: ", e);
        }
      });

      return "SUCCESS";
    },
    resetAttendance: async () => {
      // Reset Attendance for all students
      const attendanceSnapshot = await getDocs(collection(db, "attendance"));
      attendanceSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      const students = await getDocs(collection(db, "students"));
      students.forEach(async (student) => {
        const studentData = student.data();
        await setDoc(doc(db, "students", studentData.userId), {
          ...studentData,
          attendance: {
            present: 0,
            absent: 0,
          },
        });
      });
      return "SUCCESS";
    },
  },
};

export default attendanceResolver;
