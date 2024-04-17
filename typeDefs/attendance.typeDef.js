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
    createAttendance(present: [ID]!, absent: [ID]!): SuccessResponse
    updateAttendance(timestamp: ID!, totalPresent: Int, totalAbsent: Int, present: [ID], absent: [ID]): Attendance!
  }
  type SuccessResponse {
      success: Boolean!
      message: String!
  }
`;

export default attendanceTypeDef;
