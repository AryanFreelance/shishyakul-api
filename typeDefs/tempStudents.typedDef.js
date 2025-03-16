const tempStudentsTypeDef = `#graphql
type TempStudent {
    email: ID
    verificationCode: String
}

type Query {
    tempStudents: [TempStudent]
    tempStudent(email: ID): TempStudent
}

type Mutation {
    createTempStudent(email: ID, verificationCode: String): TempStudentSuccessResponse
    deleteTempStudent(email: String): String
    bulkDeleteTempStudents(emails: [String]): String
}

type TempStudentSuccessResponse {
    success: Boolean
    message: String
}

type TempStudentDeleteResponse {
    success: Boolean
    message: String
}
`;

export default tempStudentsTypeDef;
