const studentTypeDef = `#graphql
type Student {
    userId: ID
    firstname: String
    middlename: String
    lastname: String
    email: String
    ay: String
    phone: String
    grade: String
    batch: String
    attendance: StudentAttendance
    studentInformation: StudentInformation
    guardianInformation: GuardianInformation
    siblingInformation: [SiblingInformation]
    parentSection: ParentSectionInformation
    studentSection: StudentSectionInformation
    totalFees: Int
    fees: [Fees]
}

type StudentAttendance {
    present: Int
    absent: Int
}

type ParentSectionInformation {
    expectationsWithShishyakul: String
    strengthAndWeakness: String
    medicalAllergiesAndConcerns: String
}

type StudentSectionInformation {
    describeYourself: String
    passion: String
    skills: String
    hobbies: String
    dreams: String
    achievements: String
    strength: String
    weakness: String
    thingsWantToImprove: String
    anythingToShare: String
    expectationsWithShishyakul: String
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

type Query {
    studentInfo(userId: ID): Student
    students(ay: String, grade: String): [Student]
    ayStudents(ay: String): [Student]
    gStudents(ay: String, grade: String): [Student]
    student(ay: String, grade: String, userId: ID): Student
    academicYears: [String]
}

type Mutation {
    initializeStudent(
        email: String
    ): String
    createStudent(
        firstname: String,
        middlename: String,
        lastname: String,
        email: String,
        password: String,
        phone: String,
        ay: String,
        grade: String,
        verificationCode: String
    ): String
    updateStudent(
        userId: ID,
        firstname: String,
        middlename: String,
        lastname: String,
        phone: String,
        ay: String,
        newAy: String,
        grade: String,
        newGrade: String,
        batch: String,
        studentInformation: StudentInformationInput
        guardianInformation: GuardianInformationInput
        parentSection: ParentSectionInformationInput
        studentSection: StudentSectionInformationInput
        siblingInformation: [SiblingInformationInput]
    ): String
    deleteStudent(ay: String, grade: String, userId: ID): String
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

input ParentSectionInformationInput {
    expectationsWithShishyakul: String
    strengthAndWeakness: String
    medicalAllergiesAndConcerns: String
}

input StudentSectionInformationInput {
    describeYourself: String
    passion: String
    skills: String
    hobbies: String
    dreams: String
    achievements: String
    strength: String
    weakness: String
    thingsWantToImprove: String
    anythingToShare: String
    expectationsWithShishyakul: String
}
`;

export default studentTypeDef;
