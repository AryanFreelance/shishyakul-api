import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../db/index.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const studentResolver = {
  Query: {
    students: async () => {
      const students = [];
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      // Return the students in ascending order of their grades
      studentsSnapshot.forEach((doc) => {
        students.push(doc.data());
      });
      students.sort((a, b) => {
        return a.grade - b.grade;
      });
      return students;
    },
    student: async (_, { userId }) => {
      const student = await getDoc(doc(db, "students", userId));
      return student.data();
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
      })
        .then(() => {
          // // console.log(
          //   "Document written with ID: ",
          //   verification.verificationCode
          // );
        })
        .catch((error) => {
          // console.error("Error adding document: ", error);
          return "ERROR";
        });

      // console.log(verification);

      // Add TempStudent
      const tempstudent = {
        email,
        verificationCode: verification.verificationCode,
      };
      await setDoc(doc(db, "tempstudents", tempstudent.email), {
        ...tempstudent,
      })
        .then(() => {
          // console.log("Document written with ID: ", tempstudent.email);
        })
        .catch((error) => {
          // console.error("Error adding document: ", error);
          return "ERROR";
        });

      // console.log(tempstudent);

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
        grade,
        batch,
        verificationCode,
      }
    ) => {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          // console.log("USERCREDS", userCredential);
          const userId = userCredential.user.uid;
          const sId = `SKL_${phone.slice(0, 6)}_${batch}`;

          // Create Student
          await setDoc(doc(db, "students", userId), {
            userId,
            sId,
            firstname,
            middlename,
            lastname,
            email,
            phone,
            grade,
            batch,
            attendance: { present: 0, absent: 0 },
          })
            .then(() => {
              // console.log("Document written with ID: ", userId);
            })
            .catch((error) => {
              // console.error("Error adding document: ", error);
              message = false;
              return "ERROR";
            });

          // Delete TempStudent
          await deleteDoc(doc(db, "tempstudents", email))
            .then(() => {
              // console.log("Document deleted with ID: ", email);
            })
            .catch((error) => {
              // console.error("Error deleting document: ", error);
              return "ERROR";
            });

          // Delete Verification
          await deleteDoc(doc(db, "verifications", verificationCode))
            .then(() => {
              // console.log("Document deleted with ID: ", verificationCode);
            })
            .catch((error) => {
              // console.error("Error deleting document: ", error);
              return "ERROR";
            });
        })
        .catch((error) => {
          // console.log(error);
          return "ERROR";
        });

      return "SUCCESS";
    },
    updateStudent: async (
      _,
      {
        userId,
        firstname,
        middlename,
        lastname,
        phone,
        grade,
        batch,
        studentInformation,
        guardianInformation,
        siblingInformation,
      }
    ) => {
      const studentDetails = await getDoc(doc(db, "students", userId)).catch(
        (error) => {
          // console.error("Error getting document: ", error);
          return "ERROR";
        }
      );
      const updatedStudent = {
        userId,
        sId: studentDetails.data().sId,
        firstname: firstname,
        middlename: middlename,
        lastname: lastname,
        email: studentDetails.data().email,
        phone: phone,
        grade: grade,
        batch: batch,
        attendance: {
          present: studentDetails.data().attendance.present,
          absent: studentDetails.data().attendance.absent,
        },
        studentInformation: studentInformation,
        guardianInformation: guardianInformation,
        siblingInformation: siblingInformation,
      };

      // console.log("UPDATEDSTUDENT", updatedStudent);

      await setDoc(doc(db, "students", userId), { ...updatedStudent }).catch(
        (error) => {
          // console.error("Error adding document: ", error);
          return "ERROR";
        }
      );

      return "SUCCESS";
    },
    deleteStudent: async (_, { userId }) => {
      await deleteDoc(doc(db, "students", userId)).catch((error) => {
        // console.error("Error removing document: ", error);
        return "ERROR";
      });

      await getDocs(collection(db, "fees", userId, "fee"))
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            deleteDoc(doc.ref);
          });
        })
        .catch((error) => {
          // console.error("Error removing document: ", error);
          return "ERROR";
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
          // console.log(doc.data());
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
