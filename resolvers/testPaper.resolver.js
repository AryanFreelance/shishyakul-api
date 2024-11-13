import { deleteObject, ref } from "firebase/storage";
import { database, db, storage } from "../db/index.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { child, get, ref as refDB } from "firebase/database";

// TODO: Add Test Paper Attendance Feature

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
    testpaperUsers: async (_, { ay, grade, id }) => {
      // const stud = await getDoc(doc(db, "students", id));
      // const student = stud.data();

      const student = await get(
        child(refDB(database), `studs/${ay}/${grade}/${id}`)
      )
        .then((snapshot) => {
          if (snapshot.exists()) {
            // console.log(snapshot.val());
            return snapshot.val();
          } else {
            // console.log("No data available");
          }
        })
        .catch((error) => {
          // console.error(error);
        });

      const testPapersCollection = collection(db, "testPapers");
      const testPapersSnapshot = await getDocs(testPapersCollection);
      const testPapers = [];
      testPapersSnapshot.forEach((doc) => {
        let sharedWithData = doc.data().sharedWith;
        sharedWithData = sharedWithData
          .filter(
            (data) =>
              data.academicYear === student?.ay &&
              data.grade === student?.grade &&
              (data.batch === "N/A" || data.batch === student?.batch)
          )
          .map((data) => {
            // console.log("DATA", data);
            return {
              academicYear: data.academicYear,
              grade: data.grade,
              batch: data.batch || "N/A",
            };
          });
        if (sharedWithData.length > 0) {
          // console.log("SHAREDWITHDATA", sharedWithData);
          const testpaper = doc.data();
          // I want to return the marks with the student's email
          if (testpaper.marks) {
            testpaper.marks = testpaper.marks.filter(
              (mark) => mark.email === student?.email
            );
          }
          // console.log("TESTPAPER", testpaper);
          testPapers.push(testpaper);
        }
      });
      // console.log("TESTPAPERS", testPapers);
      return testPapers;
    },
    testpaperMarks: async (_, { id }) => {
      const testPaper = await getDoc(doc(db, "testPapers", id));
      if (!testPaper.data()) {
        return null;
      }
      if (!testPaper.data().marks) return [];
      // Sort and return the test paper marks in descending order
      const testpaperMarks = testPaper.data().marks;
      testpaperMarks.sort((a, b) => b.marks - a.marks);

      return testpaperMarks;
    },
    // TODO: Update the Students Fetching from Firestore to Realtime Database
    testAccessedUsers: async (_, { id }) => {
      const testPaper = await getDoc(doc(db, "testPapers", id));
      if (!testPaper.data()) {
        return null;
      }
      const students = [];
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      // console.log(testPaper.data().sharedWith);
      studentsSnapshot.forEach((doc) => {
        if (
          testPaper.data().sharedWith.includes(doc.data().email) ||
          testPaper.data().sharedWith.includes(doc.data().grade)
        ) {
          const {
            userId,
            firstname,
            middlename,
            lastname,
            email,
            phone,
            grade,
          } = doc.data();
          students.push({
            userId,
            firstname,
            middlename,
            lastname,
            email,
            phone,
            grade,
          });
          // console.log(students);
        }
      });
      return students;
    },
    testpaperAttendanceStudents: async (_, { id }) => {
      const testPaper = await getDoc(doc(db, "testPapers", id));
      const testSharedWith = testPaper.data().sharedWith;
      const students = new Set();

      const studentPromises = testSharedWith.map((sharing) =>
        get(
          child(
            refDB(database),
            `studs/${sharing.academicYear}/${sharing.grade}`
          )
        ).then((snapshot) => {
          if (!snapshot || !snapshot.exists()) return;
          const studentsInGrade = Object.values(snapshot.val());
          if (sharing.batch === "N/A") {
            studentsInGrade.forEach((student) => students.add(student));
          } else {
            studentsInGrade
              .filter((student) => student.batch === sharing.batch)
              .forEach((student) => students.add(student));
          }
        })
      );

      await Promise.all(studentPromises);
      return Array.from(students);
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
        lockShareWith: false,
      };
      // console.log(testPaper);
      await setDoc(doc(db, "testPapersDraft", testPaper.id), { ...testPaper })
        .then(() => {
          // console.log("Document successfully written!");
        })
        .catch((error) => {
          // console.error("Error writing document: ", error);
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
      // console.log(testPaper);
      await setDoc(doc(db, "testPapersDraft", testPaper.id), {
        ...prevData.data(),
        ...testPaper,
      }).catch((error) => {
        // console.error("Error writing document: ", error);
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
          // console.log("Document successfully written!");
        })
        .catch((error) => {
          // console.error("Error writing document: ", error);
          return "ERROR";
        });

      await deleteDoc(doc(db, "testPapersDraft", id))
        .then(() => {
          // console.log("Document successfully deleted!");
        })
        .catch((error) => {
          // console.error("Error deleting document: ", error);
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
      // console.log(testPaper);
      await setDoc(doc(db, "testPapers", id), { ...testPaper }).catch(
        (error) => {
          // console.error("Error writing document: ", error);
          return "ERROR";
        }
      );
      return "SUCCESS";
    },
    lockSharedWithTest: async (_, { id, lockShareWith }) => {
      await updateDoc(doc(db, "testPapers", id), {
        lockShareWith,
      })
        .then(() => {
          console.log("Document successfully updated!");
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
          return "ERROR";
        });
      return "SUCCESS";
    },
    testAttendanceHandler: async (_, { id, date, present, absent }) => {
      await runTransaction(db, async (transaction) => {
        const testDocRef = doc(db, "testPapers", id);
        const sfDoc = await transaction.get(testDocRef);
        if (!sfDoc.exists()) {
          throw "Document does not exist!";
        }

        // const newPopulation = sfDoc.data().population + 1;
        transaction.update(testDocRef, {
          present: present,
          absent: absent,
          attendanceDate: date,
        });
      }).catch(() => {
        return "ERROR";
      });
      return "SUCCESS";
    },
    addMarks: async (_, { testId, data }) => {
      const prevData = await getDoc(doc(db, "testPapers", testId));

      const today = new Date();
      const todayDate = `${today.getFullYear()}-${
        today.getMonth() + 1 < 10
          ? "0" + (today.getMonth() + 1)
          : today.getMonth() + 1
      }-${today.getDate() < 10 ? "0" + today.getDate() : today.getDate()}`;

      if (prevData.data().date >= todayDate || !prevData.data().published)
        return "ERROR";

      data.sort((a, b) => b.marks - a.marks);

      let rank = 1;
      let prevMarks = data[0].marks;
      data.forEach((mark) => {
        if (mark.marks === prevMarks) {
          mark.rank = rank;
        } else {
          rank++;
          mark.rank = rank;
        }
        prevMarks = mark.marks;
      });

      const testPaper = {
        ...prevData.data(),
        marks: data,
      };

      // console.log(testPaper);
      await setDoc(doc(db, "testPapers", testId), { ...testPaper }).catch(
        (error) => {
          // console.error("Error writing document: ", error);
          return "ERROR";
        }
      );
      return "SUCCESS";
    },
    deleteTest: async (_, { id, published }) => {
      if (published) {
        await deleteDoc(doc(db, "testPapers", id))
          .then(() => {
            // console.log("Document successfully deleted!");
          })
          .catch((error) => {
            // console.error("Error deleting document: ", error);
            return "ERROR";
          });
      } else {
        await deleteDoc(doc(db, "testPapersDraft", id))
          .then(() => {
            // console.log("Document successfully deleted!");
          })
          .catch((error) => {
            // console.error("Error deleting document: ", error);
            return "ERROR";
          });
      }

      await deleteObject(ref(storage, `test_papers/${id}`)).catch((error) => {
        // console.error("Error deleting document: ", error);
        return "ERROR";
      });
      return "SUCCESS";
    },
  },
};

export default testPaperResolver;
