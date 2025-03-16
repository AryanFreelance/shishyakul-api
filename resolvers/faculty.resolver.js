import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query as fireQuery,
    where,
    arrayUnion,
    arrayRemove,
    updateDoc,
    deleteField,
} from "firebase/firestore";

import { db } from "../db/index.js";

const facultyResolver = {
    Query: {
        facultyAssignments: async (_, { userId }) => {
            try {
                const facultyRef = doc(db, "faculties", userId);
                const facultyDoc = await getDoc(facultyRef);

                if (!facultyDoc.exists()) {
                    return [];
                }

                return facultyDoc.data().assignedStudents || [];
            } catch (error) {
                console.error("Error fetching faculty assignments:", error);
                throw new Error("Failed to fetch faculty assignments");
            }
        },
        facultyByEmail: async (_, { email }) => {
            try {
                // First find the user ID from members collection based on email
                const membersRef = collection(db, "members");
                const q = fireQuery(membersRef, where("email", "==", email));
                const memberSnapshot = await getDocs(q);

                if (memberSnapshot.empty) {
                    return null;
                }

                const memberData = memberSnapshot.docs[0].data();
                const userId = memberData.uid;

                // Now fetch faculty data with that userId
                const facultyRef = doc(db, "faculties", userId);
                const facultyDoc = await getDoc(facultyRef);

                if (!facultyDoc.exists()) {
                    return {
                        userId,
                        email,
                        assignedStudents: []
                    };
                }

                const facultyData = facultyDoc.data();
                return {
                    userId,
                    email,
                    assignedStudents: facultyData.assignedStudents || []
                };
            } catch (error) {
                console.error("Error fetching faculty by email:", error);
                throw new Error("Failed to fetch faculty by email");
            }
        },
        facultiesByAssignment: async (_, { academicYear, grade, batch }) => {
            try {
                const facultiesRef = collection(db, "faculties");
                let facultyDocs = await getDocs(facultiesRef);
                let faculties = [];

                // Get members collection for email lookup
                const membersRef = collection(db, "members");
                const membersSnapshot = await getDocs(membersRef);
                const membersMap = {};

                membersSnapshot.forEach(doc => {
                    const data = doc.data();
                    membersMap[data.uid] = data.email;
                });

                facultyDocs.forEach(doc => {
                    const facultyData = doc.data();
                    const userId = doc.id;
                    const email = membersMap[userId] || "";

                    // Check if this faculty is assigned to the specified filters
                    const matches = facultyData.assignedStudents?.some(assignment => {
                        let match = assignment.academicYear === academicYear;

                        if (match && grade) {
                            match = match && (assignment.grade === grade || !assignment.grade);
                        }

                        if (match && batch) {
                            match = match && (assignment.batch === batch || !assignment.batch);
                        }

                        return match;
                    });

                    if (matches) {
                        faculties.push({
                            userId,
                            email,
                            assignedStudents: facultyData.assignedStudents || []
                        });
                    }
                });

                return faculties;
            } catch (error) {
                console.error("Error fetching faculties by assignment:", error);
                throw new Error("Failed to fetch faculties by assignment");
            }
        },
    },
    Mutation: {
        assignFaculty: async (_, { userId, assignments }) => {
            try {
                const facultyRef = doc(db, "faculties", userId);
                const facultyDoc = await getDoc(facultyRef);

                if (!facultyDoc.exists()) {
                    // Create new faculty document
                    await setDoc(facultyRef, {
                        assignedStudents: assignments
                    });
                } else {
                    // Update existing faculty document by adding new assignments
                    for (const assignment of assignments) {
                        await updateDoc(facultyRef, {
                            assignedStudents: arrayUnion(assignment)
                        });
                    }
                }

                return "Faculty assigned successfully";
            } catch (error) {
                console.error("Error assigning faculty:", error);
                throw new Error("Failed to assign faculty");
            }
        },
        unassignFaculty: async (_, { userId, assignments }) => {
            try {
                const facultyRef = doc(db, "faculties", userId);
                const facultyDoc = await getDoc(facultyRef);

                if (!facultyDoc.exists()) {
                    return "Faculty not found";
                }

                // Remove specified assignments
                for (const assignment of assignments) {
                    await updateDoc(facultyRef, {
                        assignedStudents: arrayRemove(assignment)
                    });
                }

                // Check if there are any assignments left
                const updatedDoc = await getDoc(facultyRef);
                const updatedData = updatedDoc.data();

                if (!updatedData.assignedStudents || updatedData.assignedStudents.length === 0) {
                    // If no assignments left, consider removing the faculty record
                    await updateDoc(facultyRef, {
                        assignedStudents: deleteField()
                    });
                }

                return "Faculty unassigned successfully";
            } catch (error) {
                console.error("Error unassigning faculty:", error);
                throw new Error("Failed to unassign faculty");
            }
        },
        updateFacultyAssignments: async (_, { userId, assignments }) => {
            try {
                const facultyRef = doc(db, "faculties", userId);

                // Replace all assignments with the new ones
                await setDoc(facultyRef, {
                    assignedStudents: assignments
                }, { merge: true });

                return "Faculty assignments updated successfully";
            } catch (error) {
                console.error("Error updating faculty assignments:", error);
                throw new Error("Failed to update faculty assignments");
            }
        }
    }
};

export default facultyResolver; 