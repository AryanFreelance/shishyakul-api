const attendanceTypeDef = `#graphql
  type Attendance {
    timestamp: ID!
    present: [ID]
    absent: [ID]
  }
  type Query {
    attendances: [Attendance]
    attendance(timestamp: String!): Attendance
  }
  type Mutation {
    createAttendance(timestamp: ID!, present: [ID]!, absent: [ID]!): String
    updateAttendance(timestamp: ID!, present: [ID], absent: [ID]): String
    resetAttendance: String
  }
`;

export default attendanceTypeDef;
