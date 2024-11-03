import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database, db } from "../db/index.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import deleteObjectFromStorage from "../actions/storage/deleteObjectFromStorage.js";
import {
  child,
  get,
  onValue,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

const studentResolver = {
  Query: {
    studentInfo: async (_, { userId }) => {
      const student = await getDoc(doc(db, "studs", userId));
      if (!student.exists()) return null;
      return student.data();
    },
    students: async (_, { ay, grade }) => {
      // Get the students for the specified academic year, and if the grade is not undefined then get the students from the specific ay and grade
      let studentData,
        finalStudents = [];
      let studentRef;

      studentRef = ref(database, "studs/" + ay + "/" + grade);
      if (!grade) {
        studentRef = ref(database, "studs/" + ay);
      }

      await get(studentRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            return "NO SNAPSHOT EXISTS";
          }
          studentData = snapshot.val();
        })
        .catch((error) => {
          // console.log("ERROR WHILE FETCHING STUDENT DATA", error);
          return "ERROR";
        });

      if (!studentData) return null;

      if (grade && studentData) {
        finalStudents = Object.values(studentData);
      }

      if (!grade) {
        const grades = ["8", "9", "10", "11", "12"];

        grades.forEach((grade) => {
          if (
            studentData[grade] &&
            Object.values(studentData[grade]).length > 0
          ) {
            finalStudents.push(...Object.values(studentData[grade]));
          }
        });
      }

      return finalStudents;
    },
    ayStudents: async (_, { ay }) => {
      let studentData,
        finalStudents = [];

      const studentRef = ref(database, "studs/" + ay);
      await get(studentRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            return "NO SNAPSHOT EXISTS";
          }
          studentData = snapshot.val();
        })
        .catch((error) => {
          // console.log("ERROR WHILE FETCHING STUDENT DATA", error);
          return "ERROR";
        });

      const grades = ["8", "9", "10", "11", "12"];

      grades.forEach((grade) => {
        if (
          studentData[grade] &&
          Object.values(studentData[grade]).length > 0
        ) {
          finalStudents.push(...Object.values(studentData[grade]));
        }
      });

      return finalStudents;
    },
    gStudents: async (_, { ay, grade }) => {
      let studentData,
        finalStudents = [];

      const studentRef = ref(database, "studs/" + ay + "/" + grade);
      await get(studentRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            return "NO SNAPSHOT EXISTS";
          }
          studentData = snapshot.val();
        })
        .catch((error) => {
          // console.log("ERROR WHILE FETCHING STUDENT DATA", error);
          return "ERROR";
        });

      if (studentData) {
        finalStudents = Object.values(studentData);
      }

      return finalStudents;
    },
    student: async (_, { ay, grade, userId }) => {
      let studentData;

      const studentRef = ref(
        database,
        "studs/" + ay + "/" + grade + "/" + userId
      );
      await get(studentRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            return "NO SNAPSHOT EXISTS";
          }
          studentData = snapshot.val();
        })
        .catch((error) => {
          // console.log("ERROR WHILE FETCHING STUDENT DATA", error);
          return "ERROR";
        });

      return studentData;
    },
    academicYears: async () => {
      let studentData;

      const studentRef = ref(database, "studs");
      await get(studentRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            return "NO SNAPSHOT EXISTS";
          }
          studentData = snapshot.val();
        })
        .catch((error) => {
          // console.log("ERROR WHILE FETCHING STUDENT DATA", error);
          return "ERROR";
        });

      return Object.keys(studentData);
    },
  },
  Mutation: {
    initializeStudent: async (_, { email }) => {
      // Create Verification Code
      const tempStudent = await getDoc(doc(db, "tempstudents", email));
      const tempStudentData = tempStudent.data();
      let verification = {};
      if (tempStudentData) {
        verification = {
          verificationCode: tempStudentData.verificationCode,
          studentEmail: email,
        };
      } else {
        verification = {
          verificationCode: uuidv4(),
          studentEmail: email,
        };
      }
      await setDoc(doc(db, "verifications", verification.verificationCode), {
        ...verification,
      }).catch((error) => {
        return "ERROR";
      });

      const tempstudent = {
        email,
        verificationCode: verification.verificationCode,
      };
      await setDoc(doc(db, "tempstudents", tempstudent.email), {
        ...tempstudent,
      }).catch((error) => {
        return "ERROR";
      });

      // Return the Verification Code if successful
      return verification.verificationCode.toString();
    },
    createStudent: async (
      _,
      {
        firstname,
        middlename,
        lastname,
        email,
        password,
        phone,
        ay,
        grade,
        verificationCode,
      }
    ) => {
      try {
        const userId = (
          await createUserWithEmailAndPassword(auth, email, password)
        ).user.uid;

        // Create Student
        await Promise.all([
          set(ref(database, "studs/" + ay + "/" + grade + "/" + userId), {
            userId,
            firstname,
            middlename,
            lastname,
            email,
            phone,
            ay,
            grade,
            attendance: { present: 0, absent: 0 },
          }),
          setDoc(doc(db, "studs", userId), {
            userId,
            firstname,
            lastname,
            email,
            ay,
            grade,
          }),
          deleteDoc(doc(db, "tempstudents", email)),
          deleteDoc(doc(db, "verifications", verificationCode)),
        ]);
        // console.log("STUDENT CREATED SUCCESSFULLY");
        return "SUCCESS";
      } catch (error) {
        return "ERROR";
      }
    },
    updateStudent: async (
      _,
      {
        userId,
        firstname,
        middlename,
        lastname,
        phone,
        ay,
        newAy,
        grade,
        newGrade,
        batch,
        studentInformation,
        guardianInformation,
        siblingInformation,
      }
    ) => {
      if (newAy) {
        const aySplit = newAy.split("-");
        if (aySplit.length !== 2) {
          return "INVALID AY FORMAT";
        }
        const ayStart = parseInt(aySplit[0]);
        const ayEnd = parseInt(aySplit[1]);
        // console.log("AY", ayStart, ayEnd);
        if (ayStart < 2008 || ayEnd > new Date().getFullYear() + 1) {
          return "YEAR SHOULD BE GREATER THAN 2008 AND LESS THAN THE NEXT YEAR";
        }

        if (ayStart > ayEnd) {
          return "START YEAR CANNOT BE GREATER THAN ENDING YEAR";
        }

        if (ayStart + 1 !== ayEnd) {
          return "INVALID AY FORMAT";
        }
      }
      // console.log("NEWAY", newAy);
      // console.log("AY", ay);
      // console.log("GRADE", grade);
      // console.log("NEWGRADE", newGrade);

      const studentRef = ref(
        database,
        "studs/" + ay + "/" + grade + "/" + userId
      );
      const studentSnap = await get(studentRef).catch((error) => {
        // console.log("ERROR WHILE FETCHING STUDENT DATA", error);
        return "ERROR";
      });

      if (studentSnap === "ERROR") return "ERROR";

      // console.log("SNAPSHOT VAL", studentSnap.val());

      const data = {
        ...studentSnap.val(),
        firstname: firstname || studentSnap.val().firstname,
        middlename: middlename || studentSnap.val().middlename,
        lastname: lastname || studentSnap.val().lastname,
        phone: phone || studentSnap.val().phone,
        ay: newAy || ay,
        grade: newGrade || grade,
      };

      if (batch) data.batch = batch;
      if (studentInformation) data.studentInformation = studentInformation;
      if (guardianInformation) data.guardianInformation = guardianInformation;
      if (siblingInformation) data.siblingInformation = siblingInformation;

      // console.log("DATA", data);

      if (newAy || newGrade) {
        await remove(studentRef).catch((error) => {
          // console.log("ERROR WHILE REMOVING", error);
          return "ERROR";
        });
        const updatedStudentRef = ref(
          database,
          "studs/" + data.ay + "/" + data.grade + "/" + userId
        );
        await update(updatedStudentRef, data).catch((error) => {
          // console.log("ERROR WHILE UPDATING", error);
          return "ERROR";
        });

        await updateDoc(doc(db, "studs", userId), {
          firstname: data.firstname,
          lastname: data.lastname,
          ay: data.ay,
          grade: data.grade,
        });
        // .then(() => console.log("STUDENT UPDATED SUCCESSFULLY"));

        return "SUCCESS";
      }

      await update(studentRef, data).catch((error) => {
        // console.log("ERROR WHILE UPDATING", error);
        return "ERROR";
      });

      await updateDoc(doc(db, "studs", userId), {
        firstname: data.firstname,
        lastname: data.lastname,
      });
      // .then(() => console.log("STUDENT UPDATED SUCCESSFULLY"));

      return "SUCCESS";
    },
    deleteStudent: async (_, { ay, grade, userId }) => {
      // Check if the Student Exists in the Database
      const studentRef = ref(database, `studs/${ay}/${grade}/${userId}`);
      await get(studentRef)
        .then((snapshot) => {
          if (!snapshot.exists()) return "ERROR";
        })
        .catch((error) => {
          // console.log("ERROR WHILE FETCHING STUDENT DATA", error);
          return "ERROR";
        });

      await remove(studentRef).catch((error) => {
        console.error("ERROR WHILE REMOVING", error);
        return "ERROR";
      });

      const feesCollection = collection(db, "fees", userId, "fee");
      const feesSnapshot = await getDocs(feesCollection);
      feesSnapshot.forEach((doc) => {
        const { mode, chequeImgUrl, upiImgUrl } = doc.data();
        const imageName =
          mode === "cheque"
            ? chequeImgUrl
                .split("/")
                .slice(-1)[0]
                .split("?")[0]
                .substring(6, 16)
            : mode === "upi"
            ? upiImgUrl.split("/").slice(-1)[0].split("?")[0].substring(6, 16)
            : null;
        if (imageName) {
          deleteObjectFromStorage(`fee/${imageName}`);
        }
      });

      await deleteDoc(doc(db, "fees", userId)).catch((error) => {
        return "FEEERROR";
      });

      return "SUCCESS";
    },
  },
  Student: {
    fees: async (parent) => {
      try {
        const studentFees = [];
        const feesCollection = collection(db, "fees", parent.userId, "fee");
        const feesSnapshot = await getDocs(feesCollection);
        feesSnapshot.forEach((doc) => {
          studentFees.push(doc.data());
        });
        return studentFees;
      } catch (error) {
        // console.log(error);
      }
    },
  },
};

export default studentResolver;
