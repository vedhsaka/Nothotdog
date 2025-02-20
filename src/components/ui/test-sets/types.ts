import { TestScenario } from "@/types/test";

export interface TestSet {
  name: string;
  description: string;
  scenarios: TestScenario[];
} 