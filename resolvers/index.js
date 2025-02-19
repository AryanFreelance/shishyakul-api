import { mergeResolvers } from "@graphql-tools/merge";

import studentResolver from "./student.resolver.js";
import feesResolver from "./fees.resolver.js";
import attendanceResolver from "./attendance.resolver.js";
import testPaperResolver from "./testPaper.resolver.js";
import verificationsResolver from "./verifications.resolver.js";
import tempStudentResolver from "./tempStudents.resolver.js";
import activateResolver from "./activate.resolver.js";

const mergedResolvers = mergeResolvers([
  activateResolver,
  studentResolver,
  feesResolver,
  attendanceResolver,
  testPaperResolver,
  verificationsResolver,
  tempStudentResolver,
]);

export default mergedResolvers;
