const studentTypeDef = `#graphql
type Student {
    userId: ID!
    firstname: String!
    middlename: String
    lastname: String!
    email: String!
    phone: String
    grade: String
    attendance: AttendanceStud
    testPaper: [String]
    fees: [Fees]
    testPaperData: [TestPaper]
}

type AttendanceStud {
    present: Int!
    absent: Int!
}

type Query {
    students: [Student]
    student(userId: ID!): Student
}

type Mutation {
    createStudent(
        userId: ID!,
        firstname: String!,
        middlename: String!,
        lastname: String!,
        email: String!,
        phone: String!,
        grade: String!,
    ): SuccessStudentResponse
    updateStudent(userId: ID!,
        firstname: String,
        middlename: String,
        lastname: String,
        email: String,
        phone: String,
        grade: String,): Student
    deleteStudent(userId: ID!): DeleteStudentResponse
}

type SuccessStudentResponse {
    success: Boolean!
    message: String!
}

type DeleteStudentResponse {
    success: Boolean!
    message: String!
}
`;

export default studentTypeDef;
