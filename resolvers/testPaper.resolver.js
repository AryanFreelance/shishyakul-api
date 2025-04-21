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
  query as firestoreQuery,
  where,
} from "firebase/firestore";
import { child, get, ref as refDB } from "firebase/database";

const testPaperResolver = {
  Query: {
    testpapers: async (_, { facultyId, isAdmin }) => {
      try {
        const draftPapers = [];
        const publishedPapers = [];

        if (isAdmin) {
          // For admin, get all test papers
          const draftSnapshot = await getDocs(
            collection(db, "testPapersDraft")
          );
          const publishedSnapshot = await getDocs(collection(db, "testPapers"));

          draftSnapshot.forEach((doc) => {
            draftPapers.push({ id: doc.id, ...doc.data() });
          });

          publishedSnapshot.forEach((doc) => {
            publishedPapers.push({ id: doc.id, ...doc.data() });
          });
        } else if (facultyId) {
          // For faculty, get their specific test papers
          const facultyTestPapersRef = collection(
            db,
            "faculties",
            facultyId,
            "testpapers"
          );
          const facultySnapshot = await getDocs(facultyTestPapersRef);

          facultySnapshot.forEach((doc) => {
            const paperData = doc.data();
            if (paperData.published) {
              publishedPapers.push({ id: doc.id, ...paperData });
            } else {
              draftPapers.push({ id: doc.id, ...paperData });
            }
          });
        }

        // Sort by createdAt in descending order
        draftPapers.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        publishedPapers.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        return {
          draft: draftPapers,
          published: publishedPapers,
        };
      } catch (error) {
        console.error("Error fetching test papers:", error);
        throw new Error("Error fetching test papers");
      }
    },
    facultyTestpapers: async (_, { facultyId }) => {
      try {
        const testPapers = { published: [], draft: [] };

        // Get test papers from faculty subcollection
        const facultyTestPapersCollection = collection(
          db,
          "faculties",
          facultyId,
          "testpapers"
        );
        const facultyTestPapersSnapshot = await getDocs(
          facultyTestPapersCollection
        );

        // Sort test papers into published and draft
        facultyTestPapersSnapshot.forEach((doc) => {
          const paperData = doc.data();
          if (paperData.published) {
            testPapers.published.push(paperData);
          } else {
            testPapers.draft.push(paperData);
          }
        });

        return testPapers;
      } catch (error) {
        console.error("Error fetching faculty test papers:", error);
        return { published: [], draft: [] };
      }
    },
    allFacultyTestpapers: async () => {
      const result = [];
      const membersMap = {};
      console.log("allFacultyTestpapers");

      const membersCollection = collection(db, "members");
      const membersSnapshot = await getDocs(membersCollection);
      membersSnapshot.forEach((memberDoc) => {
        const memberData = memberDoc.data();
        membersMap[memberData.email] = memberData.name;
      });

      const testPapersCollection = collection(db, "testPapers");
      const testPapersSnapshot = await getDocs(testPapersCollection);

      const facultyMap = {};
      testPapersSnapshot.forEach((doc) => {
        const testPaperData = doc.data();
        if (testPaperData.createdBy) {
          if (!facultyMap[testPaperData.createdBy]) {
            facultyMap[testPaperData.createdBy] = {
              facultyEmail: testPaperData.createdBy,
              facultyName:
                testPaperData.creatorName ||
                membersMap[testPaperData.createdBy] ||
                "Unknown",
              testpapers: [],
            };
          }
          facultyMap[testPaperData.createdBy].testpapers.push(testPaperData);
        }
      });

      for (const email in facultyMap) {
        result.push(facultyMap[email]);
      }

      console.log("RESULT", result);

      return result;
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
    // TODO: Remove this function as it is not used now
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
    createTest: async (
      _,
      {
        id,
        title,
        subject,
        date,
        totalMarks,
        url,
        createdBy,
        creatorName,
        facultyId,
      }
    ) => {
      try {
        // Generate a clean document ID based on date and title
        const cleanTitle = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "-"); // Replace spaces with hyphens

        const formattedDate = date.replace(/-/g, ""); // Remove hyphens from date
        const documentId = `${formattedDate}-${cleanTitle}`;

        // Create the test paper data object
        const testPaperData = {
          id: documentId,
          title,
          subject,
          date,
          totalMarks,
          url,
          createdAt: new Date().toISOString(),
          published: false,
          createdBy: createdBy || null,
          creatorName: creatorName || null,
          sharedWith: [],
        };

        // Save to testPapersDraft collection
        await setDoc(doc(db, "testPapersDraft", documentId), testPaperData);

        // If created by a faculty, also save to faculty subcollection
        if (facultyId) {
          // Create subcollection path: faculties/[facultyId]/testpapers/[documentId]
          const facultyTestPaperRef = doc(
            db,
            "faculties",
            facultyId,
            "testpapers",
            documentId
          );
          await setDoc(facultyTestPaperRef, testPaperData);
        }

        return "Test Created Successfully";
      } catch (error) {
        console.error("Error creating test paper:", error);
        throw new Error(`Error creating test: ${error.message}`);
      }
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
    updateFacultyTest: async (
      _,
      {
        id,
        title,
        subject,
        date,
        totalMarks,
        url,
        published,
        createdBy,
        creatorName,
      }
    ) => {
      try {
        console.log(
          `Attempting to update faculty test. ID: ${id}, createdBy: ${createdBy}, published: ${published}`
        );

        // Determine if we're updating a draft or published test
        const collectionName = published ? "testPapers" : "testPapersDraft";
        console.log(`Looking for test in collection: ${collectionName}`);

        // Get the existing document
        const prevData = await getDoc(doc(db, collectionName, id));
        if (!prevData.exists()) {
          console.error(
            `Test paper with ID ${id} not found in ${collectionName}`
          );
          return "ERROR";
        }

        // Check if the user has permission to edit this test
        const existingData = prevData.data();
        console.log(
          `Found test. Current createdBy: ${existingData.createdBy}, Request createdBy: ${createdBy}`
        );

        if (
          existingData.createdBy !== createdBy &&
          createdBy !== "admin@shishyakul.in"
        ) {
          console.error(
            `User ${createdBy} does not have permission to edit test ${id}. Test was created by ${existingData.createdBy}`
          );
          return "PERMISSION_DENIED";
        }

        // Create the updated test paper object
        const testPaper = {
          id,
          title: title || existingData.title,
          subject: subject || existingData.subject,
          date: date || existingData.date,
          totalMarks: totalMarks || existingData.totalMarks,
          url: url || existingData.url,
          createdAt: existingData.createdAt,
          published: published,
          createdBy: createdBy || existingData.createdBy,
          creatorName: creatorName || existingData.creatorName,
          // Preserve other fields
          sharedWith: existingData.sharedWith || [],
          lockShareWith: existingData.lockShareWith || false,
          present: existingData.present || [],
          absent: existingData.absent || [],
          attendanceDate: existingData.attendanceDate || null,
        };

        // Update the document
        await setDoc(doc(db, collectionName, testPaper.id), testPaper);
        console.log(
          `Successfully updated faculty test ${id} in ${collectionName}`
        );
        return "SUCCESS";
      } catch (error) {
        console.error("Error updating faculty test:", error);
        return "ERROR";
      }
    },
    publishTestPaper: async (_, { id }) => {
      const paper = await getDoc(doc(db, "testPapersDraft", id)).then((doc) => {
        return doc.data();
      });

      const updatedPaper = {
        ...paper,
        published: true,
        sharedWith: [],
      };

      // Publish in main collection
      await setDoc(doc(db, "testPapers", id), updatedPaper)
        .then(() => {
          // console.log("Document successfully written!");
        })
        .catch((error) => {
          // console.error("Error writing document: ", error);
          return "ERROR";
        });

      // Delete from draft collection
      await deleteDoc(doc(db, "testPapersDraft", id))
        .then(() => {
          // console.log("Document successfully deleted!");
        })
        .catch((error) => {
          // console.error("Error deleting document: ", error);
          return "ERROR";
        });

      // Update in faculty subcollection if applicable
      if (paper.createdBy && paper.createdBy !== "admin@shishyakul.in") {
        try {
          // Find faculty ID from email
          const membersRef = collection(db, "members");
          const q = firestoreQuery(
            membersRef,
            where("email", "==", paper.createdBy)
          );
          const memberSnapshot = await getDocs(q);

          if (!memberSnapshot.empty) {
            const facultyId = memberSnapshot.docs[0].data().uid;

            // Update in faculty subcollection
            const facultyTestPaperRef = doc(
              db,
              "faculties",
              facultyId,
              "testpapers",
              id
            );
            await updateDoc(facultyTestPaperRef, { published: true });
          }
        } catch (error) {
          console.error("Error updating faculty test paper:", error);
          // Continue execution even if faculty update fails
        }
      }

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
          // console.log("Document successfully updated!");
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
          return "ERROR";
        });
      return "SUCCESS";
    },
    testAttendanceHandler: async (
      _,
      { id, date, present, absent, facultyId }
    ) => {
      // If facultyId is provided, verify that each student in present and absent arrays
      // is assigned to this faculty member
      if (facultyId) {
        try {
          // First, get the test paper to find which students are shared with it
          const testPaperRef = doc(db, "testPapers", id);
          const testPaperDoc = await getDoc(testPaperRef);

          if (!testPaperDoc.exists()) {
            throw new Error("Test paper not found");
          }

          const testPaperData = testPaperDoc.data();
          const sharedWith = testPaperData.sharedWith || [];

          // Get faculty assignments
          const facultyRef = doc(db, "faculties", facultyId);
          const facultyDoc = await getDoc(facultyRef);

          if (facultyDoc.exists()) {
            const facultyData = facultyDoc.data();
            const facultyAssignments = facultyData.assignedStudents || [];

            // If the faculty has assignments, filter the students
            if (facultyAssignments.length > 0 && sharedWith.length > 0) {
              // Get all students that match the test paper sharing criteria
              const assignedStudentIds = [];

              // For each sharing criteria in the test paper
              for (const sharing of sharedWith) {
                const { academicYear, grade, batch } = sharing;

                // Get students for this academic year and grade
                const studentRef = ref(
                  database,
                  `studs/${academicYear}/${grade}`
                );
                const snapshot = await get(studentRef);

                if (snapshot.exists()) {
                  const studentsData = snapshot.val();
                  const studentsInGrade = Object.values(studentsData);

                  // Filter students by batch if specified
                  const filteredStudents =
                    batch && batch !== "N/A"
                      ? studentsInGrade.filter(
                          (student) => student.batch === batch
                        )
                      : studentsInGrade;

                  // Check if each student is assigned to this faculty
                  filteredStudents.forEach((student) => {
                    const isAssigned = facultyAssignments.some((assignment) => {
                      // Match on academic year
                      if (assignment.academicYear !== academicYear)
                        return false;

                      // If grade is specified, it must match
                      if (
                        assignment.grade &&
                        assignment.grade !== "all" &&
                        assignment.grade !== student.grade
                      )
                        return false;

                      // If batch is specified, it must match
                      if (
                        assignment.batch &&
                        assignment.batch !== "all" &&
                        assignment.batch !== student.batch
                      )
                        return false;

                      return true;
                    });

                    if (isAssigned) {
                      assignedStudentIds.push(student.userId);
                    }
                  });
                }
              }

              // Filter present and absent arrays to only include assigned students
              present = present.filter((studentId) =>
                assignedStudentIds.includes(studentId)
              );
              absent = absent.filter((studentId) =>
                assignedStudentIds.includes(studentId)
              );
            }
          }
        } catch (error) {
          console.error(
            "Error filtering students by faculty assignment:",
            error
          );
        }
      }

      await runTransaction(db, async (transaction) => {
        const testDocRef = doc(db, "testPapers", id);
        const sfDoc = await transaction.get(testDocRef);
        if (!sfDoc.exists()) {
          throw "Document does not exist!";
        }

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
      try {
        // Get the document to check if it's a faculty test paper
        const collectionName = published ? "testPapers" : "testPapersDraft";
        const testDoc = await getDoc(doc(db, collectionName, id));

        if (!testDoc.exists()) {
          console.error(`Test paper ${id} not found in ${collectionName}`);
          return "ERROR";
        }

        const testData = testDoc.data();

        // Delete from main collection
        await deleteDoc(doc(db, collectionName, id));

        // If created by a faculty, also delete from faculty subcollection
        if (
          testData.createdBy &&
          testData.createdBy !== "admin@shishyakul.in"
        ) {
          try {
            // Find faculty ID from email
            const membersRef = collection(db, "members");
            const q = firestoreQuery(
              membersRef,
              where("email", "==", testData.createdBy)
            );
            const memberSnapshot = await getDocs(q);

            if (!memberSnapshot.empty) {
              const facultyId = memberSnapshot.docs[0].data().uid;

              // Delete from faculty subcollection
              const facultyTestPaperRef = doc(
                db,
                "faculties",
                facultyId,
                "testpapers",
                id
              );
              await deleteDoc(facultyTestPaperRef);
              console.log(
                `Deleted test paper ${id} from faculty ${facultyId} subcollection`
              );
            }
          } catch (error) {
            console.error(
              `Error deleting from faculty subcollection: ${error.message}`
            );
            // Continue execution even if faculty deletion fails
          }
        }

        // Delete from storage if exists
        try {
          const fileRef = ref(storage, `test_papers/${id}`);
          await deleteObject(fileRef);
          console.log(`Deleted file from storage: test_papers/${id}`);
        } catch (error) {
          // File might not exist, which is fine
          console.error(`Error deleting file from storage: ${error.message}`);
        }

        return "SUCCESS";
      } catch (error) {
        console.error(`Error in deleteTest: ${error.message}`);
        return "ERROR";
      }
    },
    updateTestAttendance: async (
      _,
      { id, present, absent, attendanceDate }
    ) => {
      try {
        // Get the test paper document
        const testPaperRef = doc(db, "testPapers", id);
        const testPaperDoc = await getDoc(testPaperRef);

        if (!testPaperDoc.exists()) {
          throw new Error("Test paper not found");
        }

        // Update the attendance data
        await updateDoc(testPaperRef, {
          present: present || [],
          absent: absent || [],
          attendanceDate: attendanceDate || new Date().toISOString(),
        });

        // If it's a faculty test paper, also update in the faculty subcollection
        const testPaperData = testPaperDoc.data();
        if (
          testPaperData.createdBy &&
          testPaperData.createdBy !== "admin@shishyakul.in"
        ) {
          // Find faculty ID from email
          const membersRef = collection(db, "members");
          const q = firestoreQuery(
            membersRef,
            where("email", "==", testPaperData.createdBy)
          );
          const memberSnapshot = await getDocs(q);

          if (!memberSnapshot.empty) {
            const facultyId = memberSnapshot.docs[0].data().uid;
            const facultyTestPaperRef = doc(
              db,
              "faculties",
              facultyId,
              "testpapers",
              id
            );
            await updateDoc(facultyTestPaperRef, {
              present: present || [],
              absent: absent || [],
              attendanceDate: attendanceDate || new Date().toISOString(),
            });
          }
        }

        return "Attendance updated successfully";
      } catch (error) {
        console.error("Error updating test attendance:", error);
        throw new Error("Error updating test attendance");
      }
    },
  },
};

export default testPaperResolver;
