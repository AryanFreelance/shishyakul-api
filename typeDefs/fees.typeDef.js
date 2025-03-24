const feesTypeDef = `#graphql
type Fees {
    userId: ID
    id: String
    email: String
    feesPaid: Int
    paidOn: String
    month: String
    year: String
    createdAt: String
    mode: String
    chequeRefNo: String
    upiId: String
    chequeImgUrl: String
    upiImgUrl: String
    neftRefNo: String
    remark: String
    academicYear: String
}

type Query {
    fees: [Fees]
    studentFees(userId: ID, academicYear: String): [Fees]
    studentAllFees(userId: ID): [Fees]
}

type Mutation {
    createFee(id: ID, userId: String, email: String, feesPaid: Int, paidOn: String, month: String, year: String, mode: String, chequeRefNo: String, upiId: String, chequeImgUrl: String, upiImgUrl: String, neftRefNo: String, academicYear: String): String
    updateFee(id: ID, userId: String, remark: String, academicYear: String): String
    updateStudentTotalFees(userId: ID, totalFees: Int, academicYear: String): Boolean
    deleteFee(userId: ID, id: ID, academicYear: String): String
}
`;

export default feesTypeDef;
