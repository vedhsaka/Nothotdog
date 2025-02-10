// services/db/db.service.ts
import { prisma } from '@/lib/prisma';
import { TestRun } from '@/types/runs';
import { SavedTest } from '@/types/saved';
import { SimplifiedTestCases, TestVariation, TestVariations } from '@/types/variations';
import { PersonaMappings } from '@/types/persona-mapping';
import { Rule } from '../agents/claude/types';

const DEFAULT_USER_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

export class DbService {
  private static instance: DbService;

  private constructor() {}

  static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  async initialize() {
    await prisma.organizations.upsert({
      where: { id: DEFAULT_ORG_ID },
      update: {},
      create: {
        id: DEFAULT_ORG_ID,
        name: 'Default Organization'
      }
    });

    await prisma.profiles.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        clerk_id: 'default',
        org_id: DEFAULT_ORG_ID
      }
    });
  }

  // Test Runs
  // async getTestRuns(): Promise<TestRun[]> {
  //   const runs = await prisma.test_runs.findMany({
  //     where: { created_by: DEFAULT_USER_ID },
  //     include: {
  //       test_conversations: {
  //         include: {
  //           conversation_messages: true
  //         }
  //       }
  //     },
  //     orderBy: { created_at: 'desc' }
  //   });

  //   return runs.map(run => ({
  //     id: run.id,
  //     name: run.name,
  //     timestamp: run.created_at!.toISOString(),
  //     status: run.status as 'running' | 'completed' | 'failed',
  //     metrics: {
  //       total: run.total_tests || 0,
  //       passed: run.passed_tests || 0,
  //       failed: run.failed_tests || 0,
  //       chats: run.test_conversations.length,
  //       correct: run.passed_tests || 0,
  //       incorrect: run.failed_tests || 0
  //     },
  //     chats: run.test_conversations.map(conv => ({
  //       id: conv.id,
  //       name: conv.id,
  //       scenario: conv.id,
  //       status: conv.status as 'running' | 'passed' | 'failed',
  //       messages: conv.conversation_messages.map(msg => ({
  //         id: msg.id,
  //         chatId: conv.id,
  //         role: msg.role as 'user' | 'assistant',
  //         content: msg.content,
  //         metrics: {
  //           responseTime: msg.response_time || 0,
  //           validationScore: msg.validation_score || 0
  //         }
  //       })),
  //       metrics: {
  //         correct: conv.status === 'passed' ? 1 : 0,
  //         incorrect: conv.status === 'failed' ? 1 : 0,
  //         responseTime: conv.conversation_messages
  //           .map(m => m.response_time || 0),
  //         validationScores: conv.conversation_messages
  //           .map(m => m.validation_score || 0),
  //         contextRelevance: []
  //       },
  //       timestamp: conv.created_at!.toISOString()
  //     }))
  //   }));
  // }

  // async createTestRun(run: TestRun) {
  //   return prisma.test_runs.create({
  //     data: {
  //       id: run.id,
  //       name: run.name,
  //       status: run.status,
  //       total_tests: run.metrics.total,
  //       passed_tests: run.metrics.passed,
  //       failed_tests: run.metrics.failed,
  //       created_by: DEFAULT_USER_ID,
  //       test_conversations: {
  //         create: run.chats.map(chat => ({
  //           scenario_id: chat.scenario,
  //           persona_id: DEFAULT_USER_ID, // Simplified for now
  //           status: chat.status,
  //           conversation_messages: {
  //             create: chat.messages.map(msg => ({
  //               role: msg.role,
  //               content: msg.content,
  //               is_correct: msg.metrics?.validationScore === 1,
  //               response_time: msg.metrics?.responseTime,
  //               validation_score: msg.metrics?.validationScore
  //             }))
  //           }
  //         }))
  //       }
  //     }
  //   });
  // }

  // Saved Tests
  async getSavedTests(): Promise<SavedTest[]> {
    const tests = await prisma.test_scenarios.findMany({
      where: {
        agent_configs: {
          org_id: DEFAULT_ORG_ID
        }
      },
      include: {
        agent_configs: {
          include: {
            agent_headers: true
          }
        }
      }
    });

    return tests.map(test => ({
      id: test.id,
      name: test.name,
      agentEndpoint: test.agent_configs.endpoint,
      headers: test.agent_configs.agent_headers.reduce((acc, header) => ({
        ...acc,
        [header.key]: header.value
      }), {}),
      input: test.input,
      expectedOutput: test.expected_output,
      rules: []
    }));
  }

  // Test Variations
  // async getTestVariations(): Promise<TestVariations> {
  //   const variations = await prisma.test_scenarios.findMany({
  //     where: {
  //       agent_configs: {
  //         org_id: DEFAULT_ORG_ID
  //       }
  //     },
  //     include: {
  //       agent_configs: true
  //     }
  //   });

  //   return variations.reduce((acc, variation) => ({
  //     ...acc,
  //     [variation.agent_configs.id]: [{
  //       id: variation.id,
  //       testId: variation.agent_configs.id,
  //       sourceTestId: variation.agent_configs.id,
  //       timestamp: variation.created_at!.toISOString(),
  //       cases: [{
  //         id: variation.id,
  //         scenario: variation.name,
  //         expectedOutput: variation.expected_output,
  //         sourceTestId: variation.agent_configs.id
  //       }]
  //     }]
  //   }), {});
  // }

  // Persona Mappings
  async getPersonaMappings(): Promise<PersonaMappings> {
    const mappings = await prisma.agent_persona_mappings.findMany({
      where: {
        agent_configs: {
          org_id: DEFAULT_ORG_ID
        }
      }
    });

    return mappings.reduce((acc, mapping) => ({
      ...acc,
      [mapping.agent_id]: {
        id: mapping.id,
        testId: mapping.agent_id,
        personaIds: [mapping.persona_id],
        createdAt: mapping.created_at!.toISOString(),
        updatedAt: mapping.created_at!.toISOString()
      }
    }), {});
  }

  async updateTestRun(run: TestRun) {
    return prisma.test_runs.update({
      where: { id: run.id },
      data: {
        status: run.status,
        total_tests: run.metrics.total,
        passed_tests: run.metrics.passed,
        failed_tests: run.metrics.failed,
      }
    });
  }


async getTestVariations(testId: string): Promise<SimplifiedTestCases> {
  // Query all test_scenarios for the given test (agent) id.
  const scenarios = await prisma.test_scenarios.findMany({
    where: { agent_id: testId },
    orderBy: { created_at: 'desc' }
  });

  // Map to a simplified object with only the fields we need.
  const testCases = scenarios.map(scenario => ({
    id: scenario.id,
    scenario: scenario.name, // we use the 'name' field as the scenario text
    expectedOutput: scenario.expected_output
  }));

  return { testId, testCases };
}

async createTestVariation(variation: TestVariation) {
  const testScenariosData = variation.cases.map((testCase) => ({
    id: testCase.id,
    agent_id: variation.testId,
    name: testCase.scenario,
    input: testCase.scenario,
    expected_output: testCase.expectedOutput,
    created_at: new Date(variation.timestamp),
    updated_at: new Date(variation.timestamp),
  }));

  const result = await prisma.test_scenarios.createMany({
    data: testScenariosData,
  });

  return result;
}

async updateTestVariation(variation: TestVariation) {
  const editedCase = variation.cases[0];
  return prisma.test_scenarios.update({
    where: { id: editedCase.id },
    data: {
      name: editedCase.scenario,
      input: editedCase.scenario,
      expected_output: editedCase.expectedOutput,
      updated_at: new Date(variation.timestamp)
    }
  });
}


async deleteTestVariation(variation: TestVariation) {
  const remainingIds = variation.cases.map(tc => tc.id);
  const result = await prisma.test_scenarios.deleteMany({
    where: {
      agent_id: variation.testId,
      id: {
        notIn: remainingIds
      }
    }
  });
  return { deletedCount: result.count };
}

}



export const dbService = DbService.getInstance();