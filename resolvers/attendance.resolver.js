import { db } from "../db/index.js";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

const attendanceResolver = {
  Query: {
    attendances: async () => {
      const attendance = [];
      const attendanceCollection = collection(db, "attendance");
      const attendanceSnapshot = await getDocs(attendanceCollection);
      attendanceSnapshot.forEach((doc) => {
        console.log(doc.data());
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
    createAttendance: async (_, { present, absent }) => {
      let today = new Date();
      let id = `${today.getFullYear()}${
        today.getHours() < 10 ? "0" + today.getHours() : today.getHours()
      }${
        today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes()
      }${
        today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds()
      }`;
      const attendance = {
        // timestamp: new Date().getTime().toString(),
        timestamp: id,
        present,
        absent,
      };
      console.log(attendance);
      const attendanceDoc = doc(db, "attendance", attendance.timestamp);
      await setDoc(attendanceDoc, attendance);

      // Update the present and absent student id's and increase their present or absent count by 1 in the student collection, update only those who are present or absent
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

      return { success: true, message: "Attendance created successfully" };
    },
    updateAttendance: async (_, { timestamp, present, absent }) => {
      const prevData = await getDoc(doc(db, "attendance", timestamp));
      const attendance = {
        timestamp,
        present: present || prevData.data().present,
        absent: absent || prevData.data().absent,
      };
      console.log(attendance);
      // Check if the present or absent array has changed, if yes then update the student collection by increasing or decreasing the present or absent count by 1
      if (present) {
        const prevPresent = prevData.data().present;
        present.forEach(async (studentId) => {
          if (!prevPresent.includes(studentId)) {
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
          }
        });
        prevPresent.forEach(async (studentId) => {
          if (!present.includes(studentId)) {
            const studentDoc = doc(db, "students", studentId);
            const student = await getDoc(studentDoc);
            const studentData = student.data();
            await setDoc(studentDoc, {
              ...studentData,
              attendance: {
                ...studentData.attendance,
                present: studentData.attendance.present - 1,
              },
            });
          }
        });
      }

      if (absent) {
        const prevAbsent = prevData.data().absent;
        absent.forEach(async (studentId) => {
          if (!prevAbsent.includes(studentId)) {
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
          }
        });
        prevAbsent.forEach(async (studentId) => {
          if (!absent.includes(studentId)) {
            const studentDoc = doc(db, "students", studentId);
            const student = await getDoc(studentDoc);
            const studentData = student.data();
            await setDoc(studentDoc, {
              ...studentData,
              attendance: {
                ...studentData.attendance,
                absent: studentData.attendance.absent - 1,
              },
            });
          }
        });
      }

      await setDoc(doc(db, "attendance", attendance.timestamp), {
        ...attendance,
      });
      return attendance;
    },
  },
};

export default attendanceResolver;
