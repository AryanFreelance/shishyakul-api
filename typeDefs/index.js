import { mergeTypeDefs } from "@graphql-tools/merge";

import feesTypeDef from "./fees.typeDef.js";
import studentTypeDef from "./student.typeDef.js";
import attendanceTypeDef from "./attendance.typeDef.js";
import testPaperTypeDef from "./testPaper.typeDef.js";

const mergedTypeDefs = mergeTypeDefs([
  studentTypeDef,
  feesTypeDef,
  attendanceTypeDef,
  testPaperTypeDef,
]);

export default mergedTypeDefs;
