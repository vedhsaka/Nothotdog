import { BufferMemory } from "langchain/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { QaAgentConfig, TestResult } from './types';
import { ApiHandler } from './apiHandler';
import { ConversationHandler } from './conversationHandler';
import { ResponseValidator } from './validators';
import { TestMessage } from "@/types/runs";
import { v4 as uuidv4 } from 'uuid';
import { ModelFactory } from "@/services/llm/modelfactory";
import { AnthropicModel } from "@/services/llm/enums";
import { SYSTEM_PROMPTS } from "@/services/prompts";

export class QaAgent {
  private model;
  private memory: BufferMemory;
  private config: QaAgentConfig;
  private prompt: ChatPromptTemplate;

  constructor(config: QaAgentConfig) {

    this.config = config;

    const apiKey = localStorage.getItem('anthropic_api_key');
    if (!apiKey) {
      throw new Error('Anthropic API key not found. Please add your API key in settings.');
    }

    this.model = ModelFactory.createLangchainModel(
      config.modelId || AnthropicModel.Sonnet3_5,
      apiKey
    )

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
    });

    const personas = {
    } as const;

    type PersonaKey = keyof typeof personas; 

    const personaKey = config.persona as PersonaKey | undefined;
    const personaSystemPrompt = personaKey ? personas[personaKey]?.systemPrompt : undefined;
  

    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPTS.API_TESTER(personaSystemPrompt)],
      ["human", "{input}"]
    ]);
  }

  async runTest(scenario: string, expectedOutput: string): Promise<TestResult> {
    try {
      const chain = RunnableSequence.from([
        this.prompt,
        this.model,
        new StringOutputParser()
      ]);

      // Generate initial conversation plan
      const planResult = await chain.invoke({
        input: `Test this scenario: ${scenario}\nExpected behavior: ${expectedOutput}\n\nPlan and start a natural conversation to test this scenario.`
      });

      const testMessage = ConversationHandler.extractTestMessage(planResult);
      const conversationPlan = ConversationHandler.extractConversationPlan(planResult);
      
      let allMessages: TestMessage[] = [];
      let totalResponseTime = 0;
      let startTime = Date.now();

      // Initial message
      const formattedInput = ApiHandler.formatInput(testMessage, this.config.apiConfig.inputFormat);

      let apiResponse = await ApiHandler.callEndpoint(
        this.config.endpointUrl, 
        this.config.headers, 
        formattedInput
      );
      let chatResponse = apiResponse?.response?.text || ConversationHandler.extractChatResponse(apiResponse, this.config.apiConfig.rules);

      totalResponseTime += Date.now() - startTime;
      
      const chatId = uuidv4();

      allMessages.push({
        id: uuidv4(),
        chatId: chatId,
        role: 'user',
        content: testMessage,
        metrics: {
          responseTime: totalResponseTime,
          validationScore: 1
        }
      });

      allMessages.push({
        id: uuidv4(),
        chatId: chatId,
        role: 'assistant',
        content: chatResponse,
        metrics: {
          responseTime: totalResponseTime,
          validationScore: 1
        }

      });

      // Handle multi-turn conversation
      if (conversationPlan && conversationPlan.length > 0) {
        for (const plannedTurn of conversationPlan) {
          const followUpResult = await chain.invoke({
            input: `Previous API response: "${chatResponse}"\n\nGiven this response and your plan: "${plannedTurn}"\n\nContinue the conversation naturally.`
          });
          
          const followUpMessage = ConversationHandler.extractTestMessage(followUpResult);
          startTime = Date.now();
          
          const followUpInput = ApiHandler.formatInput(followUpMessage, this.config.apiConfig.inputFormat);


          try {
            apiResponse = await ApiHandler.callEndpoint(
              this.config.endpointUrl,
              this.config.headers,
              followUpInput,
            );
            chatResponse = apiResponse?.response?.text || ConversationHandler.extractChatResponse(apiResponse, this.config.apiConfig.rules);
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('API request timed out after 10 seconds');
            }
            throw error;
          }

          const turnResponseTime = Date.now() - startTime
          totalResponseTime += Date.now() - startTime;
          allMessages.push({
            id: uuidv4(),
            chatId: chatId,
            role: 'user',
            content: followUpMessage,
            metrics: {
              responseTime: turnResponseTime,
              validationScore: 1
            }
          });
          // Add assistant message
          allMessages.push({
            id: uuidv4(),
            chatId: chatId,
            role: 'assistant',
            content: chatResponse,
            metrics: {
              responseTime: turnResponseTime,
              validationScore: 1
            }
          });
        }
      }

      // Validate and analyze
      const formatValid = ResponseValidator.validateResponseFormat(apiResponse, this.config.apiConfig.outputFormat);
      const conditionMet = ResponseValidator.validateCondition(apiResponse, this.config.apiConfig.rules);

      const fullConversation = allMessages
      .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

      // Validate entire conversation
      const conversationValidation = await this.validateFullConversation(
        fullConversation,
        scenario,
        expectedOutput
      );

      const validatedMessages = allMessages.map(msg => ({
        ...msg,
        isCorrect: msg.id === allMessages[allMessages.length - 1].id ? 
          conversationValidation.isCorrect : 
          true,
        explanation: msg.id === allMessages[allMessages.length - 1].id ? 
          conversationValidation.explanation : 
          undefined
      }));

      return {
        conversation: {
          humanMessage: testMessage,
          rawInput: formattedInput,
          rawOutput: apiResponse,
          chatResponse,
          allMessages: validatedMessages
        },
        validation: {
          passedTest: formatValid && conditionMet && conversationValidation.isCorrect,
          formatValid,
          conditionMet,
          explanation: conversationValidation.explanation,
          conversationResult: conversationValidation,
          metrics: {
            responseTime: totalResponseTime
          }
        }
      };
    } catch (error) {
      console.error('Error in runTest:', error);
      throw error;
    }
  }

  private async validateFullConversation(
    fullConversation: string,
    scenario: string,
    expectedOutput: string
  ) {
    const prompt = `Evaluate if this complete conversation fulfills the test scenario:
  Test Scenario: ${scenario}
  Expected Behavior: ${expectedOutput}
  Complete Conversation:
  ${fullConversation}
  Evaluate if the conversation achieved the expected behavior. Consider the entire context.
  Return JSON: { "isCorrect": boolean, "explanation": "why" }`;
  
    const result = await this.model.invoke([{
      role: 'user',
      content: prompt
    }]);
  
    try {
      const content = typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse validation result:', error);
      return { isCorrect: false, explanation: 'Validation failed' };
    }
  }
}

//       // Final analysis
//       const analysisResult = await chain.invoke({
//         input: `Analyze if this conversation met our test expectations:

// Original scenario: ${scenario}
// Expected behavior: ${expectedOutput}

// Conversation:
// ${allMessages.map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`).join('\n\n')}

// Consider that the response format was ${formatValid ? 'valid' : 'invalid'}
// and the condition was ${conditionMet ? 'met' : 'not met'}.

// Did the interaction meet our expectations? Explain why or why not.`
//       });

//       await this.memory.saveContext(
//         { input: testMessage },
//         { output: chatResponse }
//       );

//       return {
//         conversation: {
//           humanMessage: testMessage,
//           rawInput: formattedInput,
//           rawOutput: apiResponse,
//           chatResponse,
//           allMessages
//         },
//         validation: {
//           passedTest: formatValid && conditionMet,
//           formatValid,
//           conditionMet,
//           explanation: analysisResult,
//           metrics: {
//             responseTime: totalResponseTime
//           }
//         }
//       };

//     } catch (error) {
//       console.error('Error in runTest:', error);
//       throw error;
//     }
//   }


//   async reset(): Promise<void> {
//     await this.memory.clear();
//   }
// }
