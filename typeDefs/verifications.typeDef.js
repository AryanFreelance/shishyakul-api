const verificationsTypeDef = `#graphql
type Verification {
    verificationCode: ID!
    expired: Boolean!
    studentEmail: String!
}

type Query {
    verifications: [Verification]
    verification(verificationCode: ID!): Verification
    verifyStudentCode(verificationCode: ID!): String!
}

type Mutation {
    createVerification(studentEmail: String!): SuccessResponse
    updateVerification(verificationCode: ID!, expired: Boolean): SuccessResponse
    # verifyStudentCode(verificationCode: ID!): Boolean!
    deleteVerification(verificationCode: ID!): DeleteResponse
}

type SuccessResponse {
    code: ID!
    success: Boolean!
    message: String!
}

type DeleteResponse {
    success: Boolean!
    message: String!
}
`;

export default verificationsTypeDef;
