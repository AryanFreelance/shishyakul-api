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
    fee(id: ID!): Fees
    studFees(userId: ID!): [Fees]
}

type Mutation {
    createFee(userId: ID!, email: String!, feesPaid: Int!, paidOn: String!, month: String!, year: String!): Fees!
    updateFee(userId: ID!, feeId: ID!, name: String, fee: Int): Fees!
    deleteFee(id: ID!): Fees!
}
`;

export default feesTypeDef;
