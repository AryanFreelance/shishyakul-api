import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, storage } from "../db/index.js";
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
import { deleteObject, ref } from "firebase/storage";

// Firestore Database "studs" Collection Structure

// Collection - studs / Document - <AcademicYear> / Collection - <Grade> / Document - <UserID> / Fields - { data }

const studentResolver = {
  Query: {
    ayStudents: async (_, { ay }) => {
      const ayDoc = doc(db, "studs", ay);
      const gradeCollections = await Promise.all(
        ["8", "9", "10", "11", "12"].map((grade) =>
          getDocs(collection(ayDoc, grade)).then((gradeDocs) =>
            gradeDocs.docs.map((gradeDoc) => ({ ...gradeDoc.data() }))
          )
        )
      ).then((gradeCollections) => gradeCollections.flat());

      console.log("GRADE COLLECTION", gradeCollections);

      return gradeCollections;
    },
    gStudents: async (_, { ay, grade }) => {
      const gStudents = await getDocs(collection(db, "studs", ay, grade));
      return gStudents.docs.map((doc) => doc.data());
    },
    student: async (_, { ay, grade, userId }) => {
      const studentRef = doc(db, "studs", ay, grade, userId);
      const studentSnap = await getDoc(studentRef);
      return studentSnap.exists() ? studentSnap.data() : null;
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
        ay,
        grade,
        verificationCode,
      }
    ) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userId = userCredential.user.uid;

        // Create Student
        await Promise.all([
          setDoc(doc(db, "studs", ay, grade, userId), {
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
          deleteDoc(doc(db, "tempstudents", email)),
          deleteDoc(doc(db, "verifications", verificationCode)),
        ]);
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
        grade,
        batch,
        studentInformation,
        guardianInformation,
        siblingInformation,
      }
    ) => {
      const studentRef = doc(db, "studs", ay, grade, userId);
      const studentSnap = await getDoc(studentRef).catch((error) => {
        return "ERROR";
      });

      if (studentSnap === "ERROR") return "ERROR";

      let data = {
        firstname: firstname || studentSnap.data().firstname,
        middlename: middlename || studentSnap.data().middlename,
        lastname: lastname || studentSnap.data().lastname,
        phone: phone || studentSnap.data().phone,
        ay,
        grade,
      };

      if (batch) data.batch = batch;
      if (studentInformation) data.studentInformation = studentInformation;
      if (guardianInformation) data.guardianInformation = guardianInformation;
      if (siblingInformation) data.siblingInformation = siblingInformation;

      console.log("DATA", data);

      await updateDoc(doc(db, "studs", ay, grade, userId), data, {
        merge: true,
      });

      return "SUCCESS";
    },
    deleteStudent: async (_, { ay, grade, userId }) => {
      // Check if the Student Exists in the Database
      const student = await getDoc(doc(db, "studs", ay, grade, userId));
      if (!student.exists()) return "ERROR";

      // Delete the Student Document from the database
      await deleteDoc(doc(db, "studs", ay, grade, userId)).catch((error) => {
        // console.error("Error removing document: ", error);
        return "STUDENTERROR";
      });

      // Get the fees document of the students and delete the images of fees one by one
      const feesCollection = collection(db, "fees", userId, "fee");
      const feesSnapshot = await getDocs(feesCollection);
      feesSnapshot.forEach((doc) => {
        const feeData = doc.data();
        console.log(feeData);
        let imageName = null;

        if (feeData.mode === "cheque") {
          imageName = feeData.chequeImgUrl
            .split("/")
            .slice(-1)[0]
            .split("?")[0]
            .substring(6, 16);
        } else if (feeData.mode === "upi") {
          imageName = feeData.upiImgUrl
            .split("/")
            .slice(-1)[0]
            .split("?")[0]
            .substring(6, 16);
        }

        console.log(imageName);

        if (imageName) {
          deleteObject(ref(storage, `fee/${imageName}`));
        }
      });

      // After deleting the Images from Storage, delete the entire fees document from the userId document

      await deleteDoc(doc(db, "fees", userId)).catch((error) => {
        // console.error("Error removing document: ", error);
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
        console.log(error);
      }
    },
  },
};

export default studentResolver;
