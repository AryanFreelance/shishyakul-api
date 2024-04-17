import { db } from "../db/index.js";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

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
    updateTest: async (_, { id, title, subject, date, totalMarks, url }) => {
      const prevData = await getDoc(doc(db, "testPapers", id));
      const testPaper = {
        id,
        title: title || prevData.data().title,
        subject: subject || prevData.data().subject,
        date: date || prevData.data().date,
        totalMarks: totalMarks || prevData.data().totalMarks,
        url: url || prevData.data().url,
        createdAt: prevData.data().createdAt,
      };
      console.log(testPaper);
      await setDoc(doc(db, "testPapers", testPaper.id), { ...testPaper });
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
      await deleteDoc(doc(db, "testPapers", id));
      return testPaper.data();
    },
  },
};

export default testPaperResolver;
