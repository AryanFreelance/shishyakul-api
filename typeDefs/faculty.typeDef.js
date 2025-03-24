const facultyTypeDef = `#graphql
type FacultyAssignment {
    academicYear: String
    grade: String
    batch: String
}

type Faculty {
    userId: ID
    email: String
    assignedStudents: [FacultyAssignment]
}

type Query {
    facultyAssignments(userId: ID): [FacultyAssignment]
    facultyByEmail(email: String): Faculty
    facultiesByAssignment(academicYear: String, grade: String, batch: String): [Faculty]
}

type Mutation {
    assignFaculty(userId: ID, assignments: [FacultyAssignmentInput]): String
    unassignFaculty(userId: ID, assignments: [FacultyAssignmentInput]): String
    updateFacultyAssignments(userId: ID, assignments: [FacultyAssignmentInput]): String
}

input FacultyAssignmentInput {
    academicYear: String
    grade: String
    batch: String
}
`;

export default facultyTypeDef; 