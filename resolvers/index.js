import { mergeResolvers } from "@graphql-tools/merge";

import feesResolver from "./fees.resolver.js";
import studentResolver from "./student.resolver.js";
import attendanceResolver from "./attendance.resolver.js";
import testPaperResolver from "./testPaper.resolver.js";
import verificationsResolver from "./verifications.resolver.js";
import tempStudentsResolver from "./tempStudents.resolver.js";
import activateResolver from "./activate.resolver.js";
import facultyResolver from "./faculty.resolver.js";
import birthdaysResolver from "./birthdays.resolver.js";

const mergedResolvers = mergeResolvers([
  activateResolver,
  studentResolver,
  feesResolver,
  attendanceResolver,
  testPaperResolver,
  verificationsResolver,
  tempStudentsResolver,
  facultyResolver,
  birthdaysResolver,
]);

export default mergedResolvers;
