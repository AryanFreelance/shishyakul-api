const birthdaysTypeDef = `#graphql
type Birthday {
  userId: ID
  firstname: String
  lastname: String
  dob: String
  email: String
  grade: String
  ay: String
  batch: String
  notificationSent: Boolean
}

type TodaysBirthdays {
  today: [Birthday]
  upcoming: [Birthday]
}

type Query {
  birthdays(ay: String): [Birthday]
  todaysBirthdays: TodaysBirthdays
  upcomingBirthdays(limit: Int): [Birthday]
  studentsBirthdaysByMonth(month: Int, ay: String): [Birthday]
}

type Mutation {
  updateBirthdayNotification(userId: ID, notificationSent: Boolean): String
}
`;

export default birthdaysTypeDef; 