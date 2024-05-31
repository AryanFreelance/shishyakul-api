import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "../db/index.js";
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
      const testPapers = { published: [], draft: [] };
      const testPapersCollection = collection(db, "testPapers");
      const testPapersSnapshot = await getDocs(testPapersCollection);
      testPapersSnapshot.forEach((doc) => {
        testPapers.published.push(doc.data());
      });
      const testPapersDraftCollection = collection(db, "testPapersDraft");
      const testPapersDraftSnapshot = await getDocs(testPapersDraftCollection);
      testPapersDraftSnapshot.forEach((doc) => {
        testPapers.draft.push(doc.data());
      });
      return testPapers;
    },
    testpaper: async (_, { id, published }) => {
      if (published) {
        const testPaper = await getDoc(doc(db, "testPapers", id));
        return testPaper.data();
      }
      const testPaper = await getDoc(doc(db, "testPapersDraft", id));
      return testPaper.data();
    },
    testpaperUsers: async (_, { id }) => {
      const stud = await getDoc(doc(db, "students", id));
      const student = stud.data();

      const testPapersCollection = collection(db, "testPapers");
      const testPapersSnapshot = await getDocs(testPapersCollection);
      const testPapers = [];
      testPapersSnapshot.forEach((doc) => {
        if (
          doc.data().sharedWith.includes(student?.email) ||
          doc.data().sharedWith.includes(student?.grade)
        ) {
          testPapers.push(doc.data());
        }
      });
      return testPapers;
    },
  },
  Mutation: {
    createTest: async (_, { id, title, subject, date, totalMarks, url }) => {
      const testPaper = {
        id,
        title,
        subject,
        date,
        totalMarks,
        url,
        createdAt: new Date().toLocaleString(),
        published: false,
      };
      console.log(testPaper);
      await setDoc(doc(db, "testPapersDraft", testPaper.id), { ...testPaper })
        .then(() => {
          console.log("Document successfully written!");
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          return "ERROR";
        });

      return "SUCCESS";
    },
    updateDraftTest: async (_, { id, title, subject, date, totalMarks }) => {
      const prevData = await getDoc(doc(db, "testPapersDraft", id));
      const testPaper = {
        id,
        title: title || prevData.data().title,
        subject: subject || prevData.data().subject,
        date: date || prevData.data().date,
        totalMarks: totalMarks || prevData.data().totalMarks,
        url: prevData.data().url,
        createdAt: prevData.data().createdAt,
        published: false,
      };
      console.log(testPaper);
      await setDoc(doc(db, "testPapersDraft", testPaper.id), {
        ...testPaper,
      }).catch((error) => {
        console.error("Error writing document: ", error);
        return "ERROR";
      });
      return "SUCCESS";
    },
    publishTestPaper: async (_, { id }) => {
      const paper = await getDoc(doc(db, "testPapersDraft", id)).then((doc) => {
        return doc.data();
      });
      await setDoc(doc(db, "testPapers", id), {
        ...paper,
        published: true,
        sharedWith: [],
      })
        .then(() => {
          console.log("Document successfully written!");
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          return "ERROR";
        });

      await deleteDoc(doc(db, "testPapersDraft", id))
        .then(() => {
          console.log("Document successfully deleted!");
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
          return "ERROR";
        });
      return "SUCCESS";
    },
    updateSharedTest: async (_, { id, sharedWith }) => {
      const prevData = await getDoc(doc(db, "testPapers", id));
      const testPaper = {
        ...prevData.data(),
        sharedWith,
      };
      console.log(testPaper);
      await setDoc(doc(db, "testPapers", id), { ...testPaper }).catch(
        (error) => {
          console.error("Error writing document: ", error);
          return "ERROR";
        }
      );
      return "SUCCESS";
    },
    deleteTest: async (_, { id, published }) => {
      if (published) {
        await deleteDoc(doc(db, "testPapers", id))
          .then(() => {
            console.log("Document successfully deleted!");
          })
          .catch((error) => {
            console.error("Error deleting document: ", error);
            return "ERROR";
          });
      } else {
        await deleteDoc(doc(db, "testPapersDraft", id))
          .then(() => {
            console.log("Document successfully deleted!");
          })
          .catch((error) => {
            console.error("Error deleting document: ", error);
            return "ERROR";
          });
      }

      await deleteObject(ref(storage, `test_papers/${id}`)).catch((error) => {
        console.error("Error deleting document: ", error);
        return "ERROR";
      });
      return "SUCCESS";
    },
  },
};

export default testPaperResolver;
