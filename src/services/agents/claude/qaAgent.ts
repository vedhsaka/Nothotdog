import { BufferMemory } from "langchain/memory";
import { BaseMessage } from "@langchain/core/messages";
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
import { AnthropicModel, OpenAIModel } from "@/services/llm/enums";
import { SYSTEM_PROMPTS } from "@/services/prompts";
import { ChattyExplorer } from "../personas/variants/chattyExplorer";
import { ImpatientUser } from "../personas/variants/impatientUser";
import { DirectProfessional } from "../personas/variants/directProfessional";
import { TechnicalExpert } from "../personas/variants/technicalExpert";
import { getModelProvider } from '@/utils/modelUtils';

export class QaAgent {
  private model;
  private memory: BufferMemory;
  private config: QaAgentConfig;
  private prompt: ChatPromptTemplate;

  constructor(config: QaAgentConfig) {
    this.config = config;
    
    const llmConfig = this.getLLMConfig();
    if (!llmConfig) {
      throw new Error('LLM configuration not found. Please configure your LLM settings.');
    }

    this.model = ModelFactory.createLangchainModel(
      llmConfig.model as AnthropicModel | OpenAIModel,
      llmConfig.key,
      config.modelOptions
    );

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
    });

    const personas = {
      chatty: ChattyExplorer,
      direct: DirectProfessional,
      impatient: ImpatientUser,
      technical: TechnicalExpert
    } as const;

    type PersonaKey = keyof typeof personas;

    const personaKey = config.persona as PersonaKey | undefined;
    const personaSystemPrompt = personaKey ? personas[personaKey]?.systemPrompt : undefined;
  
    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPTS.API_TESTER(personaSystemPrompt)],
      ["human", "{input}"]
    ]);
  }

  private getLLMConfig() {
    if (typeof window === 'undefined') return null;
    
    const activeModel = localStorage.getItem('active_model');
    if (!activeModel) return null;
  
    const provider = getModelProvider(activeModel);
    
    try {
      const llmConfig = JSON.parse(localStorage.getItem('llm_config') || '{}');
      const apiKey = llmConfig[provider];
  
      if (!apiKey) return null;
  
      return {
        provider,
        model: activeModel,
        key: apiKey
      };
    } catch (error) {
      return null;
    }
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

          const turnResponseTime = Date.now() - startTime;
          totalResponseTime += turnResponseTime;
          
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
          allMessages: validatedMessages
        },
        validation: {
          passedTest: formatValid && conditionMet && conversationValidation.isCorrect,
          formatValid,
          conditionMet,
          explanation: conversationValidation.explanation,
          conversationValidation,
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

  async reset(): Promise<void> {
    await this.memory.clear();
  }
}