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
    students: async (_, { ay, grade, batch }) => {
      try {
        let studentData = {};
        let finalStudents = [];

        // Path construction based on provided filters
        let path = "studs";
        if (ay) {
          path += `/${ay}`;
          if (grade) {
            path += `/${grade}`;
          }
        }

        const studentRef = ref(database, path);
        await get(studentRef)
          .then((snapshot) => {
            if (!snapshot.exists()) {
              return finalStudents;
            }
            studentData = snapshot.val();
          })
          .catch((error) => {
            console.error("Error while fetching student data:", error);
            return finalStudents;
          });

        // Process the data based on the path level
        if (ay && grade) {
          // If both ay and grade specified, we're at students level
          if (studentData) {
            Object.values(studentData).forEach((student) => {
              if (!batch || student.batch === batch) {
                finalStudents.push(student);
              }
            });
          }
        } else if (ay) {
          // If only ay specified, we need to iterate through grades
          const grades = Object.keys(studentData || {});
          grades.forEach((gradeKey) => {
            if (!grade || gradeKey === grade) {
              const gradeStudents = Object.values(studentData[gradeKey] || {});
              gradeStudents.forEach((student) => {
                if (!batch || student.batch === batch) {
                  finalStudents.push(student);
                }
              });
            }
          });
        } else {
          // If no filters, we need to iterate through academic years and grades
          const academicYears = Object.keys(studentData || {});
          academicYears.forEach((yearKey) => {
            if (!ay || yearKey === ay) {
              const grades = Object.keys(studentData[yearKey] || {});
              grades.forEach((gradeKey) => {
                if (!grade || gradeKey === grade) {
                  const gradeStudents = Object.values(
                    studentData[yearKey][gradeKey] || {}
                  );
                  gradeStudents.forEach((student) => {
                    if (!batch || student.batch === batch) {
                      finalStudents.push(student);
                    }
                  });
                }
              });
            }
          });
        }

        console.log("STUDENTS", finalStudents);
        return finalStudents;
      } catch (error) {
        console.error("Error fetching students:", error);
        return [];
      }
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
    gStudents: async (_, { ay, grade, facultyId }) => {
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

      // Filter students by faculty assignments if facultyId is provided
      if (facultyId) {
        // Get faculty assignments
        const facultyRef = doc(db, "faculties", facultyId);
        const facultyDoc = await getDoc(facultyRef);

        if (facultyDoc.exists()) {
          const facultyData = facultyDoc.data();
          const facultyAssignments = facultyData.assignedStudents || [];

          // Only filter if there are assignments
          if (facultyAssignments.length > 0) {
            finalStudents = finalStudents.filter((student) => {
              // Check if this student matches any of the faculty's assignments
              return facultyAssignments.some((assignment) => {
                // Match on academic year
                if (assignment.academicYear !== ay) return false;

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
            });
          }
        }
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
    studentAcademicYears: async (_, { userId }) => {
      try {
        const studentDoc = await getDoc(doc(db, "studs", userId));
        if (!studentDoc.exists()) return [];

        const studentData = studentDoc.data();
        return studentData.academicYearsHistory || [studentData.ay];
      } catch (error) {
        console.error("Error fetching student academic years:", error);
        return [];
      }
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
            academicYearsHistory: [ay],
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
        parentSection,
        studentSection,
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
      if (parentSection) data.parentSection = parentSection;
      if (studentSection) data.studentSection = studentSection;

      // console.log("DATA", data);

      if (newAy || newGrade) {
        // Get the student document from Firestore to update academic years history
        const studentDoc = await getDoc(doc(db, "studs", userId));
        let academicYearsHistory = [];

        if (studentDoc.exists()) {
          academicYearsHistory = studentDoc.data().academicYearsHistory || [ay];

          // Add the new academic year to history if it doesn't exist
          if (newAy && !academicYearsHistory.includes(newAy)) {
            academicYearsHistory.push(newAy);
          }
        }

        // If moving to a new academic year, create a new entry but keep the old one
        if (newAy && newAy !== ay) {
          // Create a new entry for the new academic year with reset attendance
          const newData = {
            ...data,
            attendance: { present: 0, absent: 0 },
          };

          // Set the new entry
          await set(
            ref(database, `studs/${newAy}/${data.grade}/${userId}`),
            newData
          ).catch((error) => {
            console.error(
              "ERROR WHILE CREATING NEW ACADEMIC YEAR ENTRY",
              error
            );
            return "ERROR";
          });

          // Update the Firestore document with the new academic year and history
          await updateDoc(doc(db, "studs", userId), {
            firstname: data.firstname,
            lastname: data.lastname,
            ay: newAy,
            grade: data.grade,
            academicYearsHistory,
          });

          return "SUCCESS";
        }
        // If only changing grade within the same academic year
        else if (newGrade && newGrade !== grade) {
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
            academicYearsHistory,
          });

          return "SUCCESS";
        }
      }

      // Regular update without changing academic year or grade
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

      // Get the student document to check academic years history
      const studentDoc = await getDoc(doc(db, "studs", userId));
      if (!studentDoc.exists()) return "ERROR";

      const studentData = studentDoc.data();
      const academicYearsHistory = studentData.academicYearsHistory || [ay];

      // Remove the student from the realtime database for this specific academic year
      await remove(studentRef).catch((error) => {
        console.error("ERROR WHILE REMOVING FROM RTDB", error);
        return "ERROR";
      });

      // Delete fees for the specific academic year
      const feeCollection = ay.replace("-", "_");
      const feesCollection = collection(db, "fees", userId, feeCollection);
      const feesSnapshot = await getDocs(feesCollection);

      // Delete fee images and documents for this academic year
      feesSnapshot.forEach(async (feeDoc) => {
        const { mode, chequeImgUrl, upiImgUrl } = feeDoc.data();
        const imageName =
          mode === "cheque"
            ? chequeImgUrl
                ?.split("/")
                .slice(-1)[0]
                .split("?")[0]
                .substring(6, 16)
            : mode === "upi"
            ? upiImgUrl?.split("/").slice(-1)[0].split("?")[0].substring(6, 16)
            : null;
        if (imageName) {
          deleteObjectFromStorage(`fee/${imageName}`);
        }

        await deleteDoc(doc(db, "fees", userId, feeCollection, feeDoc.id));
      });

      // If this is the only academic year, delete the entire student record
      if (academicYearsHistory.length <= 1) {
        // Delete the entire student record
        await deleteDoc(doc(db, "fees", userId)).catch((error) => {
          console.error("ERROR WHILE REMOVING FEES COLLECTION", error);
          return "FEEERROR";
        });

        await deleteDoc(doc(db, "studs", userId)).catch((error) => {
          console.error("ERROR WHILE REMOVING STUDENT DOC", error);
          return "ERROR";
        });

        return "SUCCESS_FULL_DELETE";
      } else {
        // Update the academicYearsHistory to remove the current academic year
        const updatedAcademicYears = academicYearsHistory.filter(
          (year) => year !== ay
        );

        await updateDoc(doc(db, "studs", userId), {
          academicYearsHistory: updatedAcademicYears,
        }).catch((error) => {
          console.error("ERROR WHILE UPDATING ACADEMIC YEARS", error);
          return "ERROR";
        });

        return "SUCCESS_PARTIAL_DELETE";
      }
    },
  },
  Student: {
    fees: async (parent) => {
      try {
        const studentFees = [];
        // Get current academic year fees
        const currentAy = parent.ay;
        const feeCollection = currentAy
          ? currentAy.replace("-", "_")
          : "current";

        const feesCollection = collection(
          db,
          "fees",
          parent.userId,
          feeCollection
        );
        const feesSnapshot = await getDocs(feesCollection);

        feesSnapshot.forEach((doc) => {
          studentFees.push(doc.data());
        });

        return studentFees;
      } catch (error) {
        console.error("Error fetching fees:", error);
        return [];
      }
    },
    academicYearsHistory: async (parent) => {
      try {
        const studentDoc = await getDoc(doc(db, "studs", parent.userId));
        if (!studentDoc.exists()) return [parent.ay];

        return studentDoc.data().academicYearsHistory || [parent.ay];
      } catch (error) {
        console.error("Error fetching academic years history:", error);
        return [parent.ay];
      }
    },
  },
};

export default studentResolver;
