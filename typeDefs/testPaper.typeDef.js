const testPaperTypeDef = `#graphql
type TestPaper {
    id: ID
    title: String
    subject: String
    date: String
    totalMarks: Int
    url: String
    sharedWith: [TestSharedWith]
    createdAt: String
    published: Boolean
    lockShareWith: Boolean
    marks: [Marks]
    attendance: TestPaperAttendance
    present: [ID]
    absent: [ID]
    attendanceDate: String
    createdBy: String
    creatorName: String
}

type TestPaperAttendance {
    date: String
    present: [ID]
    absent: [ID]
}

type Query {
    testpapers: TestPapersOutput
    testpaper(id: ID, published: Boolean): TestPaper
    testpaperUsers(ay: String, grade: String, id: ID): [TestPaperUser]
    testpaperMarks(id: ID): [Marks]
    testAccessedUsers(id: ID): [StudentCopy]
    testpaperAttendanceStudents(id: ID): [TestPaperAttendanceStudents]
    facultyTestpapers(createdBy: String, published: Boolean): [TestPaper]
    allFacultyTestpapers: [FacultyTestPapers]
}

type FacultyTestPapers {
    facultyEmail: String
    facultyName: String
    testpapers: [TestPaper]
}

type TestPaperAttendanceStudents {
    userId: ID
    firstname: String
    middlename: String
    lastname: String
    email: String
    ay: String
    grade: String
    batch: String
    marks: [Marks]
}

type TestSharedWith {
    academicYear: String
    grade: String
    batch: String
}

type TestPaperUser {
    id: ID
    title: String
    subject: String
    date: String
    totalMarks: Int
    url: String
    sharedWith: [String]
    createdAt: String
    published: Boolean
    marks: [Marks]
}

type StudentCopy {
    userId: ID
    firstname: String
    middlename: String
    lastname: String
    email: String
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
    rank: Int   
}

type Mutation {
    createTest(
        id: ID,
        title: String,
        subject: String,
        date: String,
        totalMarks: Int,
        url: String,
        createdBy: String,
        creatorName: String
    ): String
    updateDraftTest(
        id: ID,
        title: String,
        subject: String,
        date: String,
        totalMarks: Int,
    ): String
    updateFacultyTest(
        id: ID,
        title: String,
        subject: String,
        date: String,
        totalMarks: Int,
        url: String,
        published: Boolean,
        createdBy: String,
        creatorName: String
    ): String
    publishTestPaper(
        id: ID,
    ): String
    updateSharedTest(
        id: ID,
        sharedWith: [TestSharedWithInp]
    ): String
    lockSharedWithTest(
        id: ID,
        lockShareWith: Boolean
    ): String
    testAttendanceHandler(
        id: ID,
        date: String,
        present: [ID],
        absent: [ID],
        facultyId: ID
    ): String
    addMarks (
        testId: ID,
        data: [MarksInput]
    ): String
    deleteTest(id: ID, published: Boolean): String
}

input MarksInput {
    id: ID
    name: String
    email: String
    marks: Int
    grade: String
}

input TestSharedWithInp {
    academicYear: String
    grade: String
    batch: String
}
`;

export default testPaperTypeDef;
