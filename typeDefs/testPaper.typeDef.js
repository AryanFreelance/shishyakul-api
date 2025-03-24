const testPaperTypeDef = `#graphql
type TestPaper {
    id: ID
    title: String
    subject: String
    date: String
    totalMarks: Int
    url: String
    createdAt: String
    published: Boolean
    createdBy: String
    creatorName: String
    sharedWith: [SharedWith]
    lockShareWith: Boolean
    present: [String]
    absent: [String]
    attendanceDate: String
}

type TestPaperAttendance {
    date: String
    present: [ID]
    absent: [ID]
}

type Query {
    testpapers(facultyId: ID, isAdmin: Boolean): TestPapers
    testpaper(id: ID, published: Boolean): TestPaper
    testpaperUsers(ay: String, grade: String, id: ID): [TestPaperUser]
    testpaperMarks(id: ID): [Marks]
    testAccessedUsers(id: ID): [StudentCopy]
    testpaperAttendanceStudents(id: ID): [TestPaperAttendanceStudents]
    facultyTestpapers(facultyId: ID): FacultyTestPapers
    allFacultyTestpapers: [AllFacultyTestPapers]
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

type SharedWith {
    academicYear: String
    grade: String
    batch: String
}

input SharedWithInput {
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

type TestPapers {
    published: [TestPaper]
    draft: [TestPaper]
}

type AllFacultyTestPapers {
    facultyEmail: String
    facultyName: String
    testpapers: [TestPaper]
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
        id: ID
        title: String
        subject: String
        date: String
        totalMarks: Int
        url: String
        createdBy: String
        creatorName: String
        facultyId: ID
    ): String
    updateTest(
        id: ID
        title: String
        subject: String
        date: String
        totalMarks: Int
        url: String
        published: Boolean
        createdBy: String
        creatorName: String
    ): String
    updateFacultyTest(
        id: ID
        title: String
        subject: String
        date: String
        totalMarks: Int
        url: String
        published: Boolean
        createdBy: String
        creatorName: String
    ): String
    publishTestPaper(id: ID): String
    deleteTestPaper(id: ID, published: Boolean): String
    deleteTest(id: ID, published: Boolean): String
    updateSharedWith(id: ID, sharedWith: [SharedWithInput]): String
    updateSharedTest(id: ID, sharedWith: [SharedWithInput]): String
    updateTestAttendance(
        id: ID
        present: [String]
        absent: [String]
        attendanceDate: String
    ): String
    updateDraftTest(
        id: ID
        title: String
        subject: String
        date: String
        totalMarks: Int
    ): String
    lockSharedWithTest(
        id: ID
        lockShareWith: Boolean
    ): String
    testAttendanceHandler(
        id: ID
        date: String
        present: [ID]
        absent: [ID]
        facultyId: ID
    ): String
    addMarks (
        testId: ID
        data: [MarksInput]
    ): String
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
