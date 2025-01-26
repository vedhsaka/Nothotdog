import { BufferMemory } from "langchain/memory";
import { BaseMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { TokenTextSplitter } from "langchain/text_splitter";

import { QaAgentConfig, TestResult } from './types';
import { ApiHandler } from './apiHandler';
import { ConversationHandler } from './conversationHandler';
import { ResponseValidator } from './validators';
import { TestMessage } from "@/types/runs";
import { v4 as uuidv4 } from 'uuid';
import { LLMProvider, AnthropicModel, OpenAIModel } from '@/services/llm/enums';

export class QaAgent {
  private model;
  private memory: BufferMemory;
  private config: QaAgentConfig;
  private prompt: ChatPromptTemplate;
  private tokenLimiter: TokenTextSplitter;

  constructor(config: QaAgentConfig) {
  this.config = config;
  this.tokenLimiter = new TokenTextSplitter({
    encodingName: "cl100k_base",
    chunkSize: config.maxTokens || 4000,
    chunkOverlap: 0
  });

    const apiKey = this.getApiKey(config.provider);

    switch (config.provider) {
      case LLMProvider.Anthropic:
        this.model = new ChatAnthropic({
          anthropicApiKey: apiKey,
          modelName: config.modelName || AnthropicModel.Sonnet3_5,
          temperature: config.temperature || 0.7,
        });
        break;
      case LLMProvider.OpenAI:
        this.model = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: config.modelName || OpenAIModel.GPT3_5Turbo,
          temperature: config.temperature || 0.7,
        });
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
    });

    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an API tester that engages in natural human-like conversations. Your goal is to test scenarios through organic dialogue that feels authentic and unpredictable.`],
      ["human", "{input}"]
    ]);
  }

  private getApiKey(provider: LLMProvider): string {
    switch (provider) {
      case LLMProvider.Anthropic:
        return process.env.ANTHROPIC_API_KEY || '';
      case LLMProvider.OpenAI:
        return process.env.OPENAI_API_KEY || '';
      default:
        throw new Error(`No API key found for provider: ${provider}`);
    }
  }

  private async limitTokens(text: string): Promise<string> {
    const chunks = await this.tokenLimiter.splitText(text);
    return chunks[0];
  }

  async runTest(scenario: string, expectedOutput: string): Promise<TestResult> {
    try {
      const limitedScenario = await this.limitTokens(scenario);
      const limitedExpectedOutput = await this.limitTokens(expectedOutput);

      const chain = RunnableSequence.from([
        this.prompt,
        this.model,
        new StringOutputParser()
      ]);

      const planResult = await chain.invoke({
        input: `Test this scenario: ${limitedScenario}\nExpected behavior: ${limitedExpectedOutput}\n\nPlan and start a natural conversation to test this scenario.`
      });

      const testMessage = ConversationHandler.extractTestMessage(planResult);
      const conversationPlan = ConversationHandler.extractConversationPlan(planResult);
      
      let allMessages: TestMessage[] = [];
      let totalResponseTime = 0;
      let startTime = Date.now();

      const formattedInput = ApiHandler.formatInput(testMessage, this.config.apiConfig.inputFormat);
      let apiResponse = await ApiHandler.callEndpoint(this.config.endpointUrl, this.config.headers, formattedInput);
      let chatResponse = ConversationHandler.extractChatResponse(apiResponse, this.config.apiConfig.rules);
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

      const formatValid = ResponseValidator.validateResponseFormat(apiResponse, this.config.apiConfig.outputFormat);
      const conditionMet = ResponseValidator.validateCondition(apiResponse, this.config.apiConfig.rules);

      const analysisResult = await chain.invoke({
        input: `Analyze if this conversation met our test expectations:\n\nOriginal scenario: ${limitedScenario}\nExpected behavior: ${limitedExpectedOutput}\n\nConsider that the response format was ${formatValid ? 'valid' : 'invalid'} and the condition was ${conditionMet ? 'met' : 'not met'}.\n\nDid the interaction meet our expectations?`
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