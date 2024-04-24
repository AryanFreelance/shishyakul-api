import { db } from "../db/index.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

const testPaperResolver = {
  Query: {
    testpapers: async () => {
      const testPapers = [];
      const testPapersCollection = collection(db, "testPapers");
      const testPapersSnapshot = await getDocs(testPapersCollection);
      testPapersSnapshot.forEach((doc) => {
        console.log(doc.data());
        testPapers.push(doc.data());
      });
      return testPapers;
    },
    testpaper: async (_, { id }) => {
      const testPaper = await getDoc(doc(db, "testPapers", id));
      return testPaper.data();
    },
  },
  Mutation: {
    createTest: async (_, { title, subject, date, totalMarks, url }) => {
      let today = new Date();
      let id = `${today.getFullYear()}${
        today.getHours() < 10 ? "0" + today.getHours() : today.getHours()
      }${
        today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes()
      }${
        today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds()
      }`;
      const testPaper = {
        id,
        title,
        subject,
        date,
        totalMarks,
        url,
        sharedWith: [],
        createdAt: new Date().toLocaleString(),
      };
      console.log(testPaper);
      await setDoc(doc(db, "testPapers", testPaper.id), { ...testPaper });
      return testPaper;
    },
    updateTest: async (
      _,
      { id, title, subject, date, totalMarks, url, sharedWith }
    ) => {
      const prevData = await getDoc(doc(db, "testPapers", id));
      const testPaper = {
        id,
        title: title || prevData.data().title,
        subject: subject || prevData.data().subject,
        date: date || prevData.data().date,
        totalMarks: totalMarks || prevData.data().totalMarks,
        url: url || prevData.data().url,
        createdAt: prevData.data().createdAt,
        sharedWith: sharedWith || prevData.data().sharedWith,
      };
      console.log(testPaper);
      await setDoc(doc(db, "testPapers", testPaper.id), { ...testPaper });

      const studentData = await getDocs(collection(db, "students"));
      const students = studentData.docs.map((doc) => doc.data());
      // Update the test paper id in the student's testPaper array if the student's email is in the sharedWith array and if not removed the test paper id from the student's testPaper array
      students.forEach(async (student) => {
        if (sharedWith.includes(student.email)) {
          const stud = await getDoc(doc(db, "students", student.userId));
          const studData = stud.data();
          if (studData.testPaper.includes(testPaper.id)) {
            console.log("TESTID", testPaper.id);
          } else {
            studData.testPaper.push(testPaper.id);
            await setDoc(doc(db, "students", student.userId), { ...studData });
          }
          console.log(studData);
        }
      });
      console.log("TESTPAPERUPDATE", testPaper);
      return testPaper;
    },
    updateSharedTest: async (_, { id, sharedWith }) => {
      const prevData = await getDoc(doc(db, "testPapers", id));
      const testPaper = {
        id,
        title: prevData.data().title,
        subject: prevData.data().subject,
        date: prevData.data().date,
        totalMarks: prevData.data().totalMarks,
        url: prevData.data().url,
        sharedWith,
        createdAt: prevData.data().createdAt,
      };

      console.log(testPaper);
      await setDoc(doc(db, "testPapers", testPaper.id), { ...testPaper });

      //   Add the test id to the sharedWith array of the student whose id is in the sharedWith array
      sharedWith.forEach(async (studentId) => {
        const studentData = await getDoc(doc(db, "students", studentId));
        const student = studentData.data();
        const testPaper = { testId: id };
        student.testPaper.push(testPaper);
        await setDoc(doc(db, "students", studentId), { ...student });
      });

      return testPaper;
    },
    deleteTest: async (_, { id }) => {
      const testPaper = await getDoc(doc(db, "testPapers", id));
      // Remove the test paper id from all the students who have it
      const studentData = await getDocs(collection(db, "students"));
      const students = studentData.docs.map((doc) => doc.data());
      await students.forEach(async (student) => {
        const stud = await getDoc(doc(db, "students", student.userId));
        const studData = stud.data();
        studData.testPaper = studData.testPaper.filter(
          (test) => test.testId !== id
        );
        console.log(studData);
        await setDoc(doc(db, "students", student.userId), { ...studData });
      });
      await deleteDoc(doc(db, "testPapers", id));
      return testPaper.data();
    },
  },
};

export default testPaperResolver;
