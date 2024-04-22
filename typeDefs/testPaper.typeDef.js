const testPaperTypeDef = `#graphql
type TestPaper {
    id: ID!
    title: String!
    subject: String!
    date: String!
    totalMarks: Int!
    url: String!
    sharedWith: [String]
    createdAt: String!
}

type Query {
    testpapers: [TestPaper]
    testpaper(id: ID!): TestPaper
}

type Mutation {
    createTest(
        title: String!,
        subject: String!,
        date: String!,
        totalMarks: Int!,
        url: String!,
    ): TestPaper
    updateTest(
        id: ID!,
        title: String,
        subject: String,
        date: String,
        totalMarks: Int,
        url: String,
        sharedWith: [String]
    ): TestPaper
    updateSharedTest(
        id: ID!,
        sharedWith: [String]
    ): TestPaper
    deleteTest(id: ID!): TestPaper
}
`;

export default testPaperTypeDef;
