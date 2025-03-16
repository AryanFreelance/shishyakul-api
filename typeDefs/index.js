import { mergeTypeDefs } from "@graphql-tools/merge";

import feesTypeDef from "./fees.typeDef.js";
import studentTypeDef from "./student.typeDef.js";
import attendanceTypeDef from "./attendance.typeDef.js";
import testPaperTypeDef from "./testPaper.typeDef.js";
import verificationsTypeDef from "./verifications.typeDef.js";
import tempStudentsTypeDef from "./tempStudents.typedDef.js";
import activateTypeDef from "./activate.typeDef.js";
import facultyTypeDef from "./faculty.typeDef.js";

const mergedTypeDefs = mergeTypeDefs([
  activateTypeDef,
  studentTypeDef,
  feesTypeDef,
  attendanceTypeDef,
  testPaperTypeDef,
  verificationsTypeDef,
  tempStudentsTypeDef,
  facultyTypeDef,
]);

export default mergedTypeDefs;
