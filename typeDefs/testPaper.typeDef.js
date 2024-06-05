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
    marks: [Marks]
}

type Query {
    testpapers: TestPapersOutput
    testpaper(id: ID!, published: Boolean!): TestPaper
    testpaperUsers(id:ID!): [TestPaper]
    testpaperMarks(id: ID!): [Marks]
    testAccessedUsers(id: ID!): [StudentCopy]
}

type StudentCopy {
    userId: ID!
    firstname: String!
    middlename: String
    lastname: String!
    email: String!
    phone: String
    grade: String
}

type TestPapersOutput {
    published: [TestPaper]
    draft: [TestPaper]
}

type Marks {
    id: ID
    name: String
    email: String
    marks: Int
    grade: String
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
    addMarks (
        testId: ID!,
        data: [MarksInput]
    ): String
    deleteTest(id: ID!, published: Boolean!): String
}

input MarksInput {
    id: ID
    name: String
    email: String
    marks: Int
    grade: String
}
`;

export default testPaperTypeDef;
