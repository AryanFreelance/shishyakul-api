const feesTypeDef = `#graphql
type Fees {
    userId: ID!
    id: String!
    email: String!
    feesPaid: Int
    paidOn: String
    month: String
    year: String
    createdAt: String!
}

type Query {
    fees: [Fees]
    # fee(id: ID!): Fees
    # studFees(userId: ID!): [Fees]
}

type Mutation {
    createFee(userId: ID!, email: String!, feesPaid: Int!, paidOn: String!, month: String!, year: String!, mode: String!, chequeRefNo: String, upiId: String, referenceImgUrl: String): String!
    deleteFee(userId: ID!, id: ID!): String!
}
`;

export default feesTypeDef;
