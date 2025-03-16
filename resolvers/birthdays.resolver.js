import { db, database } from "../db/index.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import {
    get,
    ref,
} from "firebase/database";

const birthdaysResolver = {
    Query: {
        birthdays: async (_, { ay }) => {
            try {
                console.log("Fetching all birthdays, academic year:", ay);
                let students = [];
                let processedCount = 0;

                // Get students from the Realtime Database
                if (ay && ay !== "select-ay") {
                    // If academic year is provided, only get students from that year
                    const grades = ["8", "9", "10", "11", "12"];
                    const studentRef = ref(database, "studs/" + ay);

                    console.log(`Fetching students for academic year: ${ay}`);
                    const snapshot = await get(studentRef);
                    if (!snapshot.exists()) {
                        console.log(`No students found for academic year: ${ay}`);
                        return [];
                    }

                    const studentData = snapshot.val();

                    // Process each grade
                    for (const grade of grades) {
                        if (studentData[grade] && Object.values(studentData[grade]).length > 0) {
                            // Add each student with DOB information to the results
                            console.log("GRADE", grade);
                            Object.values(studentData[grade]).forEach(student => {
                                if (student.studentInformation?.dob) {
                                    // Convert YYYY-MM-DD to DD-MM-YYYY format
                                    const dob = student.studentInformation.dob;
                                    const formattedDob = dob.split("-").reverse().join("-");
                                    console.log("FORMATTEDDATE", formattedDob);
                                    students.push({
                                        userId: student.userId,
                                        firstname: student.firstname || "",
                                        lastname: student.lastname || "",
                                        dob: formattedDob,
                                        email: student.email || "",
                                        grade: student.grade || "",
                                        ay: student.ay || "",
                                        batch: student.batch || "",
                                    });
                                    processedCount++;
                                    console.log("PROCESSEDCOUNT", processedCount);
                                }
                            });
                        }
                    }
                    console.log("STUDENTS", students);
                    console.log(`Processed ${processedCount} students with birthdays for academic year: ${ay}`);
                } else {
                    // If no academic year is provided, get all students from all years
                    const academicYearsRef = ref(database, "studs");
                    console.log("Fetching students from all academic years");
                    const academicYearsSnapshot = await get(academicYearsRef);

                    if (!academicYearsSnapshot.exists()) {
                        console.log("No academic years found");
                        return [];
                    }

                    const academicYearsData = academicYearsSnapshot.val();
                    const academicYears = Object.keys(academicYearsData);
                    const grades = ["8", "9", "10", "11", "12"];

                    // Process each academic year and grade combination
                    for (const year of academicYears) {
                        for (const grade of grades) {
                            if (academicYearsData[year] && academicYearsData[year][grade]) {
                                let gradeStudentCount = 0;
                                Object.values(academicYearsData[year][grade]).forEach(student => {
                                    if (student.studentInformation?.dob) {
                                        // Convert YYYY-MM-DD to DD-MM-YYYY format
                                        const dob = student.studentInformation.dob;
                                        const formattedDob = dob.split("-").reverse().join("-");
                                        students.push({
                                            userId: student.userId,
                                            firstname: student.firstname || "",
                                            lastname: student.lastname || "",
                                            dob: formattedDob,
                                            email: student.email || "",
                                            grade: student.grade || "",
                                            ay: student.ay || "",
                                            batch: student.batch || "",
                                        });
                                        processedCount++;
                                        gradeStudentCount++;
                                    }
                                });
                                console.log(`Year ${year}, Grade ${grade}: Processed ${gradeStudentCount} students`);
                            }
                        }
                    }
                    console.log(`Total processed ${processedCount} students with birthdays across all academic years`);
                }

                console.log("BEFORE STUDENTS", students)

                // Sort students by month and day for better organization
                students.sort((a, b) => {
                    const [aDay, aMonth] = a.dob?.split("-") || [0, 0];
                    const [bDay, bMonth] = b.dob?.split("-") || [0, 0];

                    if (parseInt(aMonth) !== parseInt(bMonth)) {
                        return parseInt(aMonth) - parseInt(bMonth);
                    }
                    return parseInt(aDay) - parseInt(bDay);
                });

                console.log("AFTER STUDENTS", students)

                console.log(`Returning ${students.length} students with birthdays`);
                return students;
            } catch (error) {
                console.error("Error fetching birthdays:", error);
                // Include the error stack trace for debugging
                console.error("Stack trace:", error.stack);
                return [];
            }
        },

        todaysBirthdays: async () => {
            try {
                // Get today's date in DD-MM format
                const today = new Date();
                const todayFormatted = `${today.getDate().toString().padStart(2, "0")}-${(
                    today.getMonth() + 1
                )
                    .toString()
                    .padStart(2, "0")}`;

                const todayBirthdays = [];
                const upcomingBirthdays = [];

                // Next 7 days for upcoming birthdays
                const upcomingDates = [];
                for (let i = 1; i <= 7; i++) {
                    const upcomingDate = new Date();
                    upcomingDate.setDate(today.getDate() + i);
                    upcomingDates.push(
                        `${upcomingDate.getDate().toString().padStart(2, "0")}-${(
                            upcomingDate.getMonth() + 1
                        )
                            .toString()
                            .padStart(2, "0")}`
                    );
                }

                // Get all academic years
                const academicYearsRef = ref(database, "studs");
                const academicYearsSnapshot = await get(academicYearsRef);

                if (!academicYearsSnapshot.exists()) {
                    return { today: [], upcoming: [] };
                }

                const academicYearsData = academicYearsSnapshot.val();
                const academicYears = Object.keys(academicYearsData);
                const grades = ["8", "9", "10", "11", "12"];

                // Process each academic year and grade combination
                for (const year of academicYears) {
                    for (const grade of grades) {
                        if (academicYearsData[year] && academicYearsData[year][grade]) {
                            Object.values(academicYearsData[year][grade]).forEach(student => {
                                if (student.studentInformation?.dob) {
                                    const dob = student.studentInformation.dob;
                                    const formattedDob = dob.split("-").reverse().join("-");
                                    const [dobDay, dobMonth] = formattedDob.split("-");

                                    // Check if birthday is today
                                    if (`${dobDay}-${dobMonth}` === todayFormatted) {
                                        todayBirthdays.push({
                                            userId: student.userId,
                                            firstname: student.firstname || "",
                                            lastname: student.lastname || "",
                                            dob: formattedDob,
                                            email: student.email || "",
                                            grade: student.grade || "",
                                            ay: student.ay || "",
                                            batch: student.batch || "",
                                        });

                                        // Store in birthdays collection for tracking
                                        setDoc(doc(db, "birthdays", `${todayFormatted}-${student.userId}`), {
                                            userId: student.userId,
                                            firstname: student.firstname || "",
                                            lastname: student.lastname || "",
                                            dob: formattedDob,
                                            email: student.email || "",
                                            grade: student.grade || "",
                                            ay: student.ay || "",
                                            date: todayFormatted,
                                            year: today.getFullYear(),
                                            notificationSent: false,
                                        });
                                    }

                                    // Check if birthday is in upcoming days
                                    else if (upcomingDates.includes(`${dobDay}-${dobMonth}`)) {
                                        upcomingBirthdays.push({
                                            userId: student.userId,
                                            firstname: student.firstname || "",
                                            lastname: student.lastname || "",
                                            dob: formattedDob,
                                            email: student.email || "",
                                            grade: student.grade || "",
                                            ay: student.ay || "",
                                            batch: student.batch || "",
                                        });
                                    }
                                }
                            });
                        }
                    }
                }

                // Sort by ascending birthday dates
                todayBirthdays.sort((a, b) => {
                    const [aDay] = a.dob?.split("-") || [0];
                    const [bDay] = b.dob?.split("-") || [0];
                    return parseInt(aDay) - parseInt(bDay);
                });

                upcomingBirthdays.sort((a, b) => {
                    const [aDay, aMonth] = a.dob?.split("-") || [0, 0];
                    const [bDay, bMonth] = b.dob?.split("-") || [0, 0];

                    if (parseInt(aMonth) !== parseInt(bMonth)) {
                        return parseInt(aMonth) - parseInt(bMonth);
                    }
                    return parseInt(aDay) - parseInt(bDay);
                });

                return {
                    today: todayBirthdays,
                    upcoming: upcomingBirthdays,
                };
            } catch (error) {
                console.error("Error fetching today's birthdays:", error);
                return { today: [], upcoming: [] };
            }
        },

        upcomingBirthdays: async (_, { limit = 10 }) => {
            try {
                const today = new Date();
                const currentMonth = today.getMonth() + 1;
                const currentDay = today.getDate();

                let students = [];

                // Get all academic years
                const academicYearsRef = ref(database, "studs");
                const academicYearsSnapshot = await get(academicYearsRef);

                if (!academicYearsSnapshot.exists()) {
                    return [];
                }

                const academicYearsData = academicYearsSnapshot.val();
                const academicYears = Object.keys(academicYearsData);
                const grades = ["8", "9", "10", "11", "12"];

                // Process each academic year and grade combination
                for (const year of academicYears) {
                    for (const grade of grades) {
                        if (academicYearsData[year] && academicYearsData[year][grade]) {
                            Object.values(academicYearsData[year][grade]).forEach(student => {
                                if (student.studentInformation?.dob) {
                                    const dob = student.studentInformation.dob;
                                    const formattedDob = dob.split("-").reverse().join("-");
                                    const [dobDay, dobMonth] = formattedDob.split("-");

                                    // Calculate days until next birthday
                                    let daysUntilBirthday;
                                    if (parseInt(dobMonth) > currentMonth || (parseInt(dobMonth) === currentMonth && parseInt(dobDay) > currentDay)) {
                                        // Birthday is later this year
                                        const thisYearBirthday = new Date(today.getFullYear(), parseInt(dobMonth) - 1, parseInt(dobDay));
                                        daysUntilBirthday = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
                                    } else {
                                        // Birthday is next year
                                        const nextYearBirthday = new Date(today.getFullYear() + 1, parseInt(dobMonth) - 1, parseInt(dobDay));
                                        daysUntilBirthday = Math.ceil((nextYearBirthday - today) / (1000 * 60 * 60 * 24));
                                    }

                                    if (daysUntilBirthday > 0) {
                                        students.push({
                                            userId: student.userId,
                                            firstname: student.firstname || "",
                                            lastname: student.lastname || "",
                                            dob: formattedDob,
                                            email: student.email || "",
                                            grade: student.grade || "",
                                            ay: student.ay || "",
                                            batch: student.batch || "",
                                            daysUntil: daysUntilBirthday,
                                        });
                                    }
                                }
                            });
                        }
                    }
                }

                // Sort by days until birthday and limit results
                students.sort((a, b) => a.daysUntil - b.daysUntil);
                return students.slice(0, limit);
            } catch (error) {
                console.error("Error fetching upcoming birthdays:", error);
                return [];
            }
        },

        studentsBirthdaysByMonth: async (_, { month, ay }) => {
            try {
                let students = [];

                if (ay && ay !== "select-ay") {
                    // If academic year is provided, only get students from that year
                    const grades = ["8", "9", "10", "11", "12"];
                    const studentRef = ref(database, "studs/" + ay);

                    const snapshot = await get(studentRef);
                    if (!snapshot.exists()) {
                        return [];
                    }

                    const studentData = snapshot.val();

                    // Process each grade
                    for (const grade of grades) {
                        if (studentData[grade] && Object.values(studentData[grade]).length > 0) {
                            // Add each student with DOB information to the results
                            Object.values(studentData[grade]).forEach(student => {
                                if (student.studentInformation?.dob) {
                                    const dob = student.studentInformation.dob;
                                    const formattedDob = dob.split("-").reverse().join("-");
                                    const [dobDay, dobMonth] = formattedDob.split("-");

                                    // Filter by month if specified
                                    if (!month || parseInt(dobMonth) === parseInt(month)) {
                                        students.push({
                                            userId: student.userId,
                                            firstname: student.firstname || "",
                                            lastname: student.lastname || "",
                                            dob: formattedDob,
                                            email: student.email || "",
                                            grade: student.grade || "",
                                            ay: student.ay || "",
                                            batch: student.batch || "",
                                        });
                                    }
                                }
                            });
                        }
                    }
                } else {
                    // If no academic year is provided, get all students from all years
                    const academicYearsRef = ref(database, "studs");
                    const academicYearsSnapshot = await get(academicYearsRef);

                    if (!academicYearsSnapshot.exists()) {
                        return [];
                    }

                    const academicYearsData = academicYearsSnapshot.val();
                    const academicYears = Object.keys(academicYearsData);
                    const grades = ["8", "9", "10", "11", "12"];

                    // Process each academic year and grade combination
                    for (const year of academicYears) {
                        for (const grade of grades) {
                            if (academicYearsData[year] && academicYearsData[year][grade]) {
                                Object.values(academicYearsData[year][grade]).forEach(student => {
                                    if (student.studentInformation?.dob) {
                                        const dob = student.studentInformation.dob;
                                        const formattedDob = dob.split("-").reverse().join("-");
                                        const [dobDay, dobMonth] = formattedDob.split("-");

                                        // Filter by month if specified
                                        if (!month || parseInt(dobMonth) === parseInt(month)) {
                                            students.push({
                                                userId: student.userId,
                                                firstname: student.firstname || "",
                                                lastname: student.lastname || "",
                                                dob: formattedDob,
                                                email: student.email || "",
                                                grade: student.grade || "",
                                                ay: student.ay || "",
                                                batch: student.batch || "",
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    }
                }

                // Sort by day of month
                students.sort((a, b) => {
                    const [dayA] = a.dob?.split("-") || [0];
                    const [dayB] = b.dob?.split("-") || [0];
                    return parseInt(dayA) - parseInt(dayB);
                });

                return students;
            } catch (error) {
                console.error("Error fetching birthdays by month:", error);
                return [];
            }
        },
    },

    Mutation: {
        updateBirthdayNotification: async (_, { userId, notificationSent }) => {
            try {
                const today = new Date();
                const todayFormatted = `${today.getDate().toString().padStart(2, "0")}-${(
                    today.getMonth() + 1
                )
                    .toString()
                    .padStart(2, "0")}`;

                const docRef = doc(db, "birthdays", `${todayFormatted}-${userId}`);
                await setDoc(docRef, { notificationSent }, { merge: true });

                return "SUCCESS";
            } catch (error) {
                console.error("Error updating birthday notification:", error);
                return "ERROR";
            }
        },
    },
};

export default birthdaysResolver; 