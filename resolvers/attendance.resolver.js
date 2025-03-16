import {
  child,
  get,
  ref,
  remove,
  update,
  runTransaction as dbTransaction,
  set,
} from "firebase/database";
import { database, db } from "../db/index.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { isCompositeType } from "graphql";
import moment from "moment";

const attendanceResolver = {
  Query: {
    gdattendance: async (_, { ay, grade }) => {
      // const attendance = [];

      const attendance = await get(child(ref(database), `attendance`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // console.log("DATA", data[ay][grade]);
            // console.log("OBJVAL", Object.values(data[ay][grade]));
            return Object.values(data[ay][grade]);
          } else {
            // console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });

      return attendance;
    },
    attendance: async (_, { ay, grade, timestamp }) => {
      let attendance;
      await get(child(ref(database), `attendance/${ay}/${grade}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // console.log("DATA", data);
            // attendance.push(...data[ay][grade]);
            Object.values(data)?.forEach((d) => {
              // console.log("D", d);
              if (d.timestamp === timestamp) {
                // console.log("D TIMESTAMP", d);
                attendance = d;
                return d;
              }
            });
          } else {
            // console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });

      // console.log("ATTENDANCE", attendance);

      return attendance;
    },
  },
  Mutation: {
    attendanceHandler: async (
      _,
      { ay, grade, timestamp, date, present, absent }
    ) => {
      // If the attendance data is already available then just update it else create a new attendance record for the specified timestamp.
      let attendanceData = {};
      let isExists = false;

      const attendanceSnapshot = await get(
        child(ref(database), `attendance/${ay}/${grade}`)
      )
        .then((snapshot) => {
          if (snapshot.exists()) {
            // console.log("ATTENDANCE DATA", snapshot.val());
            return snapshot.val();
          } else {
            // console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });

      if (attendanceSnapshot[timestamp]) {
        attendanceData = {
          ...attendanceSnapshot[timestamp],
          present,
          absent,
          updatedAt: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        };
        isExists = true;
      } else {
        attendanceData = {
          timestamp,
          date,
          present,
          absent,
          createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
          updatedAt: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        };
      }
      // console.log("ATTTENDANCE DATA", attendanceData);

      // Check if the attendance data of a particular grade students is of more than 60 days, if yes then delete the attendance data for one date and add the new one to keep the data for only 60 days
      // console.log("ATTENDANCESNAPSHOT", attendanceSnapshot);

      // if (attendanceSnapshot) {
      //   let attendanceLength = Object.values(attendanceSnapshot).length;
      //   Object.keys(attendanceSnapshot).forEach(async (key) => {
      //     // If the length of the object is more than 60 then delete the object
      //     // console.log("KEY", Object.values(attendanceSnapshot).length);
      //     if (attendanceLength-- > 100) {
      //       // console.log("ATTENDANCELENGTH", attendanceLength);
      //       await remove(ref(database, `attendance/${ay}/${grade}/${key}`));
      //     }

      //     // console.log("KEY", key);
      //   });
      // }

      // attendanceSnapshot.forEach(async (doc) => {
      //   const attendanceData = doc.data();
      //   const date = new Date(attendanceData.timestamp);
      //   const today = new Date();
      //   const diffTime = Math.abs(today - date);
      //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      //   if (diffDays > 60) {
      //     await deleteDoc(doc.ref);
      //   }
      // });

      if (isExists) {
        // If the attendance record exists then update the record and then update the student's attendance records, just like done in the updateAttendance mutation
        await update(
          ref(database, `attendance/${ay}/${grade}/${timestamp}`),
          attendanceData
        )
          .then(() => {
            // Get NewPresent & NewAbsent
            let prevAttendanceData = attendanceSnapshot[timestamp];
            // console.log("PREVATTENDANCE", prevAttendanceData);
            let { present: prevPresent, absent: prevAbsent } =
              prevAttendanceData;

            let newPresent = present.filter(
              (studentId) => !prevPresent.includes(studentId)
            );
            let newAbsent = absent.filter(
              (studentId) => !prevAbsent.includes(studentId)
            );

            newPresent.forEach(async (studentId) => {
              await dbTransaction(
                ref(database, `studs/${ay}/${grade}/${studentId}`),
                (stud) => {
                  if (stud) {
                    if (stud?.attendance?.present) {
                      stud.attendance.present++;
                    } else {
                      stud.attendance.present = 1;
                    }

                    stud.attendance.absent = Math.max(
                      0,
                      stud.attendance.absent - 1
                    );
                  }
                  return stud;
                }
              );
            });

            newAbsent.forEach(async (studentId) => {
              await dbTransaction(
                ref(database, `studs/${ay}/${grade}/${studentId}`),
                (stud) => {
                  if (stud) {
                    if (stud?.attendance?.absent) {
                      stud.attendance.absent++;
                    } else {
                      stud.attendance.absent = 1;
                    }
                    stud.attendance.present = Math.max(
                      0,
                      stud.attendance.present - 1
                    );
                  }
                  return stud;
                }
              );
            });
          })
          .catch((error) => {
            // console.log(error);
          });
      } else {
        // If the attendance record is not present then create a new record of the attendance
        await set(
          ref(database, `attendance/${ay}/${grade}/${timestamp}`),
          attendanceData
        );

        present.forEach(async (studentId) => {
          await dbTransaction(
            ref(database, `studs/${ay}/${grade}/${studentId}`),
            (stud) => {
              if (stud) {
                if (stud?.attendance?.present) {
                  stud.attendance.present++;
                } else {
                  stud.attendance.present = 1;
                }
              }
              return stud;
            }
          );
        });

        absent.forEach(async (studentId) => {
          await dbTransaction(
            ref(database, `studs/${ay}/${grade}/${studentId}`),
            (stud) => {
              if (stud) {
                if (stud?.attendance?.absent) {
                  stud.attendance.absent++;
                } else {
                  stud.attendance.absent = 1;
                }
              }
              return stud;
            }
          );
        });
      }
      return "SUCCESS";
    },
    updateAttendance: async (_, { timestamp, present, absent }) => {
      const prevData = await getDoc(doc(db, "attendance", timestamp));
      const attendance = {
        ...prevData.data(),
        present,
        absent,
      };
      // console.log(attendance);

      const prevAttendance = prevData.data();

      const prevPresent = prevAttendance.present;
      const prevAbsent = prevAttendance.absent;

      const newPresent = present.filter((id) => !prevPresent.includes(id));
      const newAbsent = absent.filter((id) => !prevAbsent.includes(id));

      // Set the attendance document data to the updated one
      await setDoc(doc(db, "attendance", timestamp), {
        ...attendance,
      });

      newPresent.forEach(async (sID) => {
        try {
          await runTransaction(db, async (transaction) => {
            const sDoc = await transaction.get(doc(db, "students", sID));
            if (!sDoc.exists()) {
              throw "Document does not exist!";
            }

            const newPresentData = Number(sDoc.data().attendance.present) + 1;
            const newAbsentData = Number(sDoc.data().attendance.absent) - 1;

            // console.log("New Present Data", newPresentData);
            // console.log("New Absent Data", newAbsentData);
            transaction.update(doc(db, "students", sID), {
              attendance: {
                present: newPresentData,
                absent: newAbsentData,
              },
            });
          });
          // console.log("Transaction successfully committed!");
        } catch (e) {
          // console.log("Transaction failed: ", e);
        }
      });

      newAbsent.forEach(async (sID) => {
        try {
          await runTransaction(db, async (transaction) => {
            const sDoc = await transaction.get(doc(db, "students", sID));
            if (!sDoc.exists()) {
              throw "Document does not exist!";
            }

            const newAbsentData = Number(sDoc.data().attendance.absent) + 1;
            const newPresentData = Number(sDoc.data().attendance.present) - 1;

            // console.log("New Present Data", newPresentData);
            // console.log("New Absent Data", newAbsentData);

            transaction.update(doc(db, "students", sID), {
              attendance: {
                present: newPresentData,
                absent: newAbsentData,
              },
            });
          });
          // console.log("Transaction successfully committed!");
        } catch (e) {
          // console.log("Transaction failed: ", e);
        }
      });

      return "SUCCESS";
    },
    resetAttendance: async () => {
      // Reset Attendance for all students
      await remove(ref(database, "attendance")).catch((error) => {
        console.error("Error removing document: ", error);
        return "ERROR";
      });

      const studentsAttendance = await get(child(ref(database), `studs`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            // console.log(snapshot.val());
            return snapshot.val();
          } else {
            // console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });

      Object.keys(studentsAttendance).forEach((key) => {
        Object.values(studentsAttendance[key]).forEach(async (student) => {
          Object.values(student).forEach(async (stud) => {
            // console.log("STUDENT", stud);
            // console.log(`studs/${key}/${stud.grade}/${stud.userId}`);
            await update(
              ref(database, `studs/${key}/${stud.grade}/${stud.userId}`),
              {
                attendance: {
                  present: 0,
                  absent: 0,
                },
              }
            );
          });
        });
      });
      return "SUCCESS";
    },
  },
};

export default attendanceResolver;
