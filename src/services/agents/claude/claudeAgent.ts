import { ChatAnthropic } from "@langchain/anthropic";
import { BufferMemory } from "langchain/memory";
import { BaseMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { ClaudeAgentConfig, TestResult } from './types';
import { ApiHandler } from './apiHandler';
import { ConversationHandler } from './conversationHandler';
import { ResponseValidator } from './validators';

interface TestMessage {
  humanMessage: string;
  rawInput: Record<string, any>;
  rawOutput: any;
  chatResponse: string;
}

export class ClaudeAgent {
  private model: ChatAnthropic;
  private memory: BufferMemory;
  private config: ClaudeAgentConfig;
  private prompt: ChatPromptTemplate;

  constructor(config: ClaudeAgentConfig) {
    this.config = config;

    if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
      throw new Error('NEXT_PUBLIC_ANTHROPIC_API_KEY is not set');
    }

    this.model = new ChatAnthropic({
      anthropicApiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      modelName: "claude-3-sonnet-20240229",
      temperature: 0.7,
    });

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
    });

    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an API tester that engages in natural human-like conversations. Your goal is to test scenarios through organic dialogue that feels authentic and unpredictable.

You should:
1. Start conversations naturally - use greetings, small talk, or indirect questions
2. Vary your conversation style:
   - Sometimes be brief and direct
   - Sometimes engage in longer dialogues with multiple turns
   - Occasionally go off-topic or include irrelevant details
   - Use different personality traits (casual, formal, chatty, etc.)
3. Include realistic human behaviors:
   - Typos and corrections
   - Incomplete thoughts
   - Follow-up questions
   - Topic changes
   - Emotional expressions (excitement, confusion, frustration)

Format your responses as:
TEST_MESSAGE: <your natural human message>
CONVERSATION_PLAN: <optional - include if you plan multiple turns>
ANALYSIS: <your analysis of the interaction>`],
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
      let apiResponse = await ApiHandler.callEndpoint(this.config.endpointUrl, this.config.headers, formattedInput);
      let chatResponse = ConversationHandler.extractChatResponse(apiResponse, this.config.apiConfig.rules);
      totalResponseTime += Date.now() - startTime;
      
      allMessages.push({
        humanMessage: testMessage,
        rawInput: formattedInput,
        rawOutput: apiResponse,
        chatResponse
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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            apiResponse = await ApiHandler.callEndpoint(
              this.config.endpointUrl,
              this.config.headers,
              followUpInput,
              controller.signal
            );
            chatResponse = ConversationHandler.extractChatResponse(apiResponse, this.config.apiConfig.rules);
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('API request timed out after 10 seconds');
            }
            throw error;
          } finally {
            clearTimeout(timeoutId);
          }

          totalResponseTime += Date.now() - startTime;
          allMessages.push({
            humanMessage: followUpMessage,
            rawInput: followUpInput,
            rawOutput: apiResponse,
            chatResponse
          });
        }
      }

      // Validate and analyze
      const formatValid = ResponseValidator.validateResponseFormat(apiResponse, this.config.apiConfig.outputFormat);
      const conditionMet = ResponseValidator.validateCondition(apiResponse, this.config.apiConfig.rules);

      // Final analysis
      const analysisResult = await chain.invoke({
        input: `Analyze if this conversation met our test expectations:

Original scenario: ${scenario}
Expected behavior: ${expectedOutput}

Conversation:
${allMessages.map(m => `Human: ${m.humanMessage}\nAssistant: ${m.chatResponse}`).join('\n\n')}

Consider that the response format was ${formatValid ? 'valid' : 'invalid'}
and the condition was ${conditionMet ? 'met' : 'not met'}.

Did the interaction meet our expectations? Explain why or why not.`
      });

      await this.memory.saveContext(
        { input: testMessage },
        { output: chatResponse }
      );

      return {
        conversation: {
          humanMessage: testMessage,
          rawInput: formattedInput,
          rawOutput: apiResponse,
          chatResponse,
          allMessages
        },
        validation: {
          passedTest: formatValid && conditionMet,
          formatValid,
          conditionMet,
          explanation: analysisResult,
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

  async getHistory(): Promise<BaseMessage[]> {
    const memoryVars = await this.memory.loadMemoryVariables({});
    return memoryVars.chat_history || [];
  }

  async reset(): Promise<void> {
    await this.memory.clear();
  }
}