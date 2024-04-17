import { mergeResolvers } from "@graphql-tools/merge";

import studentResolver from "./student.resolver.js";
import feesResolver from "./fees.resolver.js";
import attendanceResolver from "./attendance.resolver.js";
import testPaperResolver from "./testPaper.resolver.js";

const mergedResolvers = mergeResolvers([
  studentResolver,
  feesResolver,
  attendanceResolver,
  testPaperResolver,
]);

export default mergedResolvers;
