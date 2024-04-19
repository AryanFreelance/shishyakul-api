import { db } from "../db/index.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

const studentResolver = {
  Query: {
    students: async () => {
      const students = [];
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      studentsSnapshot.forEach((doc) => {
        console.log(doc.data());
        students.push(doc.data());
      });
      return students;
    },
    student: async (_, { userId }) => {
      const student = await getDoc(doc(db, "students", userId));
      return student.data();
    },
  },
  Mutation: {
    // createStudent: async (
    //   _,
    //   {
    //     userId,
    //     firstname,
    //     middlename,
    //     lastname,
    //     email,
    //     phone,
    //     grade,
    //     present,
    //     absent,
    //   }
    // ) => {
    //   let message = {};
    //   const student = {
    //     userId,
    //     firstname,
    //     middlename,
    //     lastname,
    //     email,
    //     phone,
    //     grade,
    //     attendance: { present, absent },
    //     testPaper: [],
    //   };
    //   const validData = {
    //     userId: student.userId,
    //     firstname: student.firstname,
    //     middlename: student.middlename,
    //     lastname: student.lastname,
    //     email: student.email,
    //     phone: student.phone,
    //     grade: student.grade,
    //     attendance: student.attendance,
    //     testPaper: student.testPaper,
    //   };
    //   await setDoc(doc(db, "students", userId), { ...validData })
    //     .then(() => {
    //       console.log("Document written with ID: ", userId);
    //       message = { success: true, message: "Document written with ID" };
    //     })
    //     .catch((error) => {
    //       console.error("Error adding document: ", error);
    //       message = { success: false, message: "Error adding document" };
    //     });

    //   return message;
    // },
    createStudent: async (
      _,
      { userId, firstname, middlename, lastname, email, phone, grade }
    ) => {
      let message = {};
      await setDoc(doc(db, "students", userId), {
        userId,
        firstname,
        middlename: middlename || "",
        lastname,
        email,
        phone: phone || "",
        grade: grade,
        attendance: { present: 0, absent: 0 },
        testPaper: [],
      })
        .then(() => {
          console.log("Document written with ID: ", userId);
          message = { success: true, message: "Document written with ID" };
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
          message = { success: false, message: "Error adding document" };
        });

      return message;
    },
    updateStudent: async (
      _,
      {
        userId,
        firstname,
        middlename,
        lastname,
        email,
        phone,
        grade,
        present,
        absent,
      }
    ) => {
      const previousStudent = await getDoc(doc(db, "students", userId));
      const { ...rest } = previousStudent.data();
      const student = {
        userId,
        firstname: firstname ? firstname : rest.firstname,
        middlename: middlename ? middlename : rest.middlename,
        lastname: lastname ? lastname : rest.lastname,
        email: email ? email : rest.email,
        phone: phone ? phone : rest.phone,
        grade: grade ? grade : rest.grade,
        attendance: {
          present: present ? present : rest.attendance.present,
          absent: absent ? absent : rest.attendance.absent,
        },
      };
      let data;

      await setDoc(doc(db, "students", userId), { ...student })
        .then(() => {
          data = student;
        })
        .catch(() => {
          data = { success: false, message: "Error adding document" };
        });

      return data;
    },
    deleteStudent: async (_, { userId }) => {
      let message = {};
      await deleteDoc(doc(db, "students", userId))
        .then(() => {
          console.log("Document successfully deleted!");
          message = {
            success: true,
            message: "Document successfully deleted!",
          };
        })
        .catch((error) => {
          console.error("Error removing document: ", error);
          message = { success: false, message: "Error removing document" };
        });
      return message;
    },
  },
  Student: {
    fees: async (parent) => {
      try {
        const studentFees = [];
        const feesCollection = collection(db, "fees", parent.userId, "fee");
        const feesSnapshot = await getDocs(feesCollection);
        feesSnapshot.forEach((doc) => {
          console.log(doc.data());
          studentFees.push(doc.data());
        });
        return studentFees;
      } catch (error) {
        console.log(error);
      }
    },
  },
};

export default studentResolver;
