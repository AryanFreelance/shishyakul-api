const studentTypeDef = `#graphql
type Student {
    userId: ID!
    sId: ID!
    firstname: String!
    middlename: String
    lastname: String!
    email: String!
    phone: String
    grade: String
    batch: String
    attendance: StudentAttendance
    studentInformation: StudentInformation
    guardianInformation: GuardianInformation
    siblingInformation: [SiblingInformation]
    fees: [Fees]
}

type StudentAttendance {
    present: Int
    absent: Int
}

type Query {
    students: [Student]
    student(userId: ID!): Student
}

type Mutation {
    initializeStudent(
        email: String!
    ): String!
    createStudent(
        firstname: String!,
        middlename: String!,
        lastname: String!,
        email: String!,
        password: String!,
        phone: String!,
        grade: String!,
        batch: String!,
        verificationCode: String!
    ): String!
    updateStudent(
        userId: ID!,
        firstname: String,
        middlename: String,
        lastname: String,
        phone: String,
        grade: String,
        batch: String,
        studentInformation: StudentInformationInput
        guardianInformation: GuardianInformationInput
        siblingInformation: [SiblingInformationInput]
    ): String!
    deleteStudent(userId: ID!): String!
}

type StudentInformation {
    dob: String
    age: Int
    gender: String
    adhaar: String
    address: String
    school: String
    board: String
    medium: String
}

type GuardianInformation {
    motherFirstName: String
    motherMiddleName: String
    motherLastName: String
    motherOccupation: String
    motherDesignation: String
    motherExServiceWomen: Boolean
    motherContactNumber: String
    fatherFirstName: String
    fatherMiddleName: String
    fatherLastName: String
    fatherOccupation: String
    fatherDesignation: String
    fatherExServiceMen: Boolean
    fatherContactNumber: String
}

type SiblingInformation {
    siblingName: String
    age: Int
    status: String
    organization: String
}

input StudentInformationInput {
    dob: String
    age: Int
    gender: String
    adhaar: String
    address: String
    school: String
    class: String
    board: String
    medium: String
}

input GuardianInformationInput {
    motherFirstName: String
    motherMiddleName: String
    motherLastName: String
    motherOccupation: String
    motherDesignation: String
    motherExServiceWomen: Boolean
    motherContactNumber: String
    fatherFirstName: String
    fatherMiddleName: String
    fatherLastName: String
    fatherOccupation: String
    fatherDesignation: String
    fatherExServiceMen: Boolean
    fatherContactNumber: String
}

input SiblingInformationInput {
    siblingName: String
    age: Int
    status: String
    organization: String
}
`;

export default studentTypeDef;
