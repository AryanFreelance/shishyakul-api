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
    mode: String
    chequeRefNo: String
    upiId: String
    chequeImgUrl: String
    upiImgUrl: String
    remark: String
}

type Query {
    fees: [Fees]
}

type Mutation {
    createFee(id: ID!, userId: String!, email: String!, feesPaid: Int!, paidOn: String!, month: String!, year: String!, mode: String!, chequeRefNo: String, upiId: String, chequeImgUrl: String, upiImgUrl: String): String!
    updateFee(id: ID!, userId: String!, remark: String!): String!
    deleteFee(userId: ID!, id: ID!): String!
}
`;

export default feesTypeDef;
