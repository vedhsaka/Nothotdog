// services/db/db.service.ts
import { prisma } from '@/lib/prisma';
import { TestRun } from '@/types/runs';
import { SimplifiedTestCases, TestVariation } from '@/types/variations';
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


  //   return tests.map(test => ({
  //     id: test.id,
  //     name: test.name,
  //     agentEndpoint: test.agent_configs.endpoint,
  //     headers: test.agent_configs.agent_headers.reduce((acc, header) => ({
  //       ...acc,
  //       [header.key]: header.value
  //     }), {}),
  //     input: test.input,
  //     expectedOutput: test.expected_output,
  //     rules: []
  //   }));
  // }

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


  // Add this new method in your DbService class

  async getAgentConfigs(): Promise<any[]> {
    const configs = await prisma.agent_configs.findMany({
      where: { org_id: DEFAULT_ORG_ID },
      include: {
        agent_headers: true,
        agent_persona_mappings: true,
      },
    });

    return configs.map(config => ({
      id: config.id,
      name: config.name,
      endpoint: config.endpoint,
      headers: config.agent_headers.reduce((acc, header) => ({
        ...acc,
        [header.key]: header.value,
      }), {}),
    }));
  }

  async getAgentConfigAll(id: string) {
    const config = await prisma.agent_configs.findUnique({
      where: { id },
      include: {
        agent_headers: true,
        agent_descriptions: true,
        agent_user_descriptions: true,
        validation_rules: true,
        // Remove test_scenarios since we don't need them
        agent_outputs: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });
    if (!config) return null;
    const latestOutput = config.agent_outputs[0];
    return {
      id: config.id,
      name: config.name,
      endpoint: config.endpoint,
      inputFormat: config.input_format,
      headers: config.agent_headers.reduce((acc, h) => {
        acc[h.key] = h.value;
        return acc;
      }, {} as Record<string, string>),
      agentDescription: config.agent_descriptions?.[0]?.description ?? "",
      userDescription: config.agent_user_descriptions?.[0]?.description ?? "",
      rules: config.validation_rules.map(r => ({
        path: r.path,
        condition: r.condition,
        expectedValue: r.expected_value,
        description: r.description
      })),
      latestOutput: latestOutput ? {
        responseData: latestOutput.response_data,
        responseTime: latestOutput.response_time,
        status: latestOutput.status,
        errorMessage: latestOutput.error_message
      } : null
    };
  }

  async saveAgentConfig(configData: any) {
    const parsedResponse = this.safeJsonParse(configData.agent_response);
    let input_format = this.safeJsonParse(configData.input);

    if (configData.id) {
      // Update existing config
      return prisma.agent_configs.update({
        where: { id: configData.id },
        data: {
          name: configData.name,
          endpoint: configData.endpoint,
          input_format: input_format,
          agent_headers: {
            deleteMany: {},
            create: Object.entries(configData.headers).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          },
          agent_descriptions: {
            deleteMany: {},
            create: { description: configData.agentDescription }
          },
          agent_user_descriptions: {
            deleteMany: {},
            create: { description: configData.userDescription }
          },
          validation_rules: {
            deleteMany: {},
            create: configData.rules.map((rule: any) => ({
              path: rule.path,
              condition: rule.condition,
              expected_value: rule.value,
              description: rule.description || ""
            }))
          },
          agent_outputs: {
            deleteMany: {},
            create: {
              response_data: parsedResponse,
              response_time: configData.responseTime,
              status: "success",
              error_message: ""
            }
          }
        }
      });
    } else {
      // Create new config
      return prisma.agent_configs.create({
        data: {
          name: configData.name,
          endpoint: configData.endpoint,
          input_format: input_format,
          org_id: DEFAULT_ORG_ID,
          created_by: DEFAULT_USER_ID,
          agent_headers: {
            create: Object.entries(configData.headers).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          },
          agent_descriptions: {
            create: { description: configData.agentDescription }
          },
          agent_user_descriptions: {
            create: { description: configData.userDescription }
          },
          validation_rules: {
            create: configData.rules.map((rule: any) => ({
              path: rule.path,
              condition: rule.condition,
              expected_value: rule.value,
              description: rule.description || ""
            }))
          },
          agent_outputs: {
            create: {
              response_data: parsedResponse,
              response_time: configData.responseTime,
              status: "success",
              error_message: ""
            }
          }
        }
      });
    }
  }
  

  safeJsonParse(str: string) {
    if (!str) return {};
    try {
      return JSON.parse(str);
    } catch {
      return { rawOutput: str };
    }
  }
  
  async deleteAgentConfig(configId: string): Promise<{ deleted: boolean }> {
    try {
      // Step 1: Delete related test scenarios
      await prisma.test_scenarios.deleteMany({
        where: { agent_id: configId },
      });
  
      // Step 2: Delete related persona mappings
      await prisma.agent_persona_mappings.deleteMany({
        where: { agent_id: configId },
      });
  
      // Step 3: Delete the agent config itself
      await prisma.agent_configs.delete({
        where: { id: configId },
      });
  
      return { deleted: true };
    } catch (error) {
      console.error("Error deleting agent config:", error);
      throw new Error("Failed to delete agent config");
    }
  }
  

  async getAgentConfig(testId: string) {
    return prisma.agent_configs.findUnique({
      where: { id: testId },
      include: {
        agent_descriptions: true,
        agent_user_descriptions: true,
      },
    });
  }
  

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

async getPersonaMappingByAgentId(agentId: string): Promise<{ personaIds: string[] }> {
  const rows = await prisma.agent_persona_mappings.findMany({
    where: { agent_id: agentId },
  });
  return { personaIds: rows.map(row => row.persona_id) };
}

async createPersonaMapping(agentId: string, personaId: string): Promise<{ personaIds: string[] }> {
  await prisma.agent_persona_mappings.create({
    data: {
      agent_id: agentId,
      persona_id: personaId,
    },
  });
  return this.getPersonaMappingByAgentId(agentId);
}

async deletePersonaMapping(agentId: string, personaId: string): Promise<{ personaIds: string[] }> {
  await prisma.agent_persona_mappings.deleteMany({
    where: {
      agent_id: agentId,
      persona_id: personaId,
    },
  });
  return this.getPersonaMappingByAgentId(agentId);
}

async getPersonas(): Promise<any[]> {
  return prisma.personas.findMany({
    where: { org_id: '00000000-0000-0000-0000-000000000000' },
  });
}
}


export const dbService = DbService.getInstance();