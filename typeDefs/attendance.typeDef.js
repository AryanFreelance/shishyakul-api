const attendanceTypeDef = `#graphql
  type Attendance {
    timestamp: ID
    date: String
    present: [ID]
    absent: [ID]
    createdAt: String
    updatedAt: String
  }
  type Query {
    gdattendance(ay: String, grade: String): [Attendance]
    attendance(ay: String, grade: String, timestamp: String): Attendance
  }
  type Mutation {
    createAttendance(ay: String, grade: String, timestamp: ID, date: String, present: [ID], absent: [ID]): String
    attendanceHandler(ay: String, grade: String, timestamp: ID, date: String, present: [ID], absent: [ID]): String
    updateAttendance(timestamp: ID, present: [ID], absent: [ID]): String
    resetAttendance: String
  }
`;

export default attendanceTypeDef;
