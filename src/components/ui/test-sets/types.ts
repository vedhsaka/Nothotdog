// export interface TestScenario {
//   id?: string;
//   type: string;
//   input: string;
//   expectedOutput: string;
//   metrics?: Record<string, number>;
// }

import { TestScenario } from "@/types/test";

export interface TestSet {
  name: string;
  description: string;
  scenarios: TestScenario[];
} 