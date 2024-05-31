const testPaperTypeDef = `#graphql
type TestPaper {
    id: ID!
    title: String
    subject: String
    date: String
    totalMarks: Int
    url: String
    sharedWith: [String]
    createdAt: String!
    published: Boolean!
}

type Query {
    testpapers: TestPapersOutput
    testpaper(id: ID!, published: Boolean!): TestPaper
    testpaperUsers(id:ID!): [TestPaper]
}

type TestPapersOutput {
    published: [TestPaper]
    draft: [TestPaper]
}

type Mutation {
    createTest(
        id: ID!
        title: String!,
        subject: String!,
        date: String!,
        totalMarks: Int!,
        url: String!,
    ): String
    updateDraftTest(
        id: ID!,
        title: String,
        subject: String,
        date: String,
        totalMarks: Int,
    ): String
    publishTestPaper(
        id: ID!,
    ): String
    updateSharedTest(
        id: ID!,
        sharedWith: [String]
    ): String
    deleteTest(id: ID!, published: Boolean!): String
}
`;

export default testPaperTypeDef;
