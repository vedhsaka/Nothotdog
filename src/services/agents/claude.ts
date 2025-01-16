import { ChatAnthropic } from "@langchain/anthropic";
import { BufferMemory } from "langchain/memory";
import { BaseMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

interface Rule {
  id: string;
  path: string;
  condition: string;
  value: string;
  isValid: boolean;
}

interface ApiConfig {
  inputFormat: Record<string, any>;
  outputFormat: Record<string, any>;
  rules: Rule[];
}

interface AgentConfig {
  headers: Record<string, string>;
  endpointUrl: string;
  apiConfig: ApiConfig;
}

interface TestResult {
  conversation: {
    humanMessage: string;
    rawInput: Record<string, any>;
    rawOutput: Record<string, any>;
    chatResponse: string;
    allMessages: {
      humanMessage: string;
      rawInput: Record<string, any>;
      rawOutput: Record<string, any>;
      chatResponse: string;
    }[];
  };
  validation: {
    passedTest: boolean;
    formatValid: boolean;
    conditionMet: boolean;
    explanation: string;
    metrics: {
      responseTime: number;
    };
  };
}

export class ClaudeAgent {
  private model: ChatAnthropic;
  private memory: BufferMemory;
  private endpointUrl: string;
  private headers: Record<string, string>;
  private apiConfig: ApiConfig;
  private prompt: ChatPromptTemplate;

  constructor(config: AgentConfig) {
    this.endpointUrl = config.endpointUrl;
    this.headers = config.headers;
    this.apiConfig = config.apiConfig;

    // Initialize model using env variable
    if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
      throw new Error('NEXT_PUBLIC_ANTHROPIC_API_KEY is not set in environment variables');
    }

    this.model = new ChatAnthropic({
      anthropicApiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      modelName: "claude-3-sonnet-20240229",
      temperature: 0.7,
    });

    // Initialize memory with empty chat history
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
    });

    // Initialize prompt template with default empty chat history
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

When you receive a test scenario, plan a conversation strategy that could be:
- A single natural exchange
- A multi-turn conversation
- A meandering dialogue that eventually gets to the point
- An intentionally unclear or ambiguous interaction

Format your responses as:
TEST_MESSAGE: <your natural human message>
CONVERSATION_PLAN: <optional - include if you plan multiple turns>
ANALYSIS: <your analysis of the interaction>

Remember: The goal is to make the conversations feel genuine and unpredictable while still testing the scenario effectively.`],
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

      // 1. Generate initial conversation plan
      const planResult = await chain.invoke({
        input: `Test this scenario: ${scenario}\nExpected behavior: ${expectedOutput}\n\nPlan and start a natural conversation to test this scenario.`
      });

      const testMessage = this.extractTestMessage(planResult);
      const conversationPlan = this.extractConversationPlan(planResult);
      
      let allMessages = [];
      let totalResponseTime = 0;
      let startTime = Date.now();

      // 2. Start with initial message
      const formattedInput = this.formatInput(testMessage);
      let apiResponse = await this.callEndpoint(formattedInput);
      let chatResponse = this.extractChatResponse(apiResponse);
      totalResponseTime += Date.now() - startTime;
      
      allMessages.push({
        human: testMessage,
        assistant: chatResponse,
        responseTime: Date.now() - startTime
      });

      // 3. Continue conversation if there's a multi-turn plan
// Inside runTest method where we handle conversation
if (conversationPlan && conversationPlan.length > 0) {
  for (const plannedTurn of conversationPlan) {
    // Generate follow-up based on previous API response
    const followUpResult = await chain.invoke({
      input: `Previous API response: "${chatResponse}"\n\nGiven this response and your plan: "${plannedTurn}"\n\nContinue the conversation naturally.`
    });
    
    const followUpMessage = this.extractTestMessage(followUpResult);
    startTime = Date.now();
    
    // Make the API call with the follow-up message, with timeout
    const followUpInput = this.formatInput(followUpMessage);
    console.log('Sending follow-up:', followUpInput);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      apiResponse = await this.callEndpoint(followUpInput, controller.signal);
      chatResponse = this.extractChatResponse(apiResponse);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        throw new Error('API request timed out after 10 seconds');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    totalResponseTime += Date.now() - startTime;
    allMessages.push({
      human: followUpMessage,
      assistant: chatResponse,
      responseTime: Date.now() - startTime
    });
  }
}

      // 4. Validate final state
      const formatValid = this.validateResponseFormat(apiResponse);
      const conditionMet = this.validateCondition(apiResponse);

      // 5. Have Claude analyze the entire conversation
      const analysisResult = await chain.invoke({
        input: `Analyze if this conversation met our test expectations:

Original scenario: ${scenario}
Expected behavior: ${expectedOutput}

Conversation:
${allMessages.map(m => `Human: ${m.human}\nAssistant: ${m.assistant}`).join('\n\n')}

Consider that the response format was ${formatValid ? 'valid' : 'invalid'}
and the condition was ${conditionMet ? 'met' : 'not met'}.

Did the interaction meet our expectations? Explain why or why not.`
      });

      // Save to memory
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
          allMessages: allMessages.map(msg => ({
            humanMessage: msg.human,
            rawInput: this.formatInput(msg.human),
            rawOutput: apiResponse,
            chatResponse: msg.assistant
          }))
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

  private formatInput(message: string): Record<string, any> {
    // Create deep copy of input format
    const formattedInput = JSON.parse(JSON.stringify(this.apiConfig.inputFormat));
    
    // Get the first (and only) key from the input format
    const [inputKey] = Object.keys(formattedInput);
    
    if (inputKey) {
      formattedInput[inputKey] = message;
    } else {
      console.error('No input key found in API input format');
    }
    
    return formattedInput;
  }

  private extractTestMessage(response: string): string {
    const parts = response.split(/TEST_MESSAGE:/);
    if (parts.length < 2) return response.trim();
    
    const messagePart = parts[1].split(/\n/)[0];
    return messagePart ? messagePart.trim() : response.trim();
  }

  private extractConversationPlan(response: string): string[] | null {
    const parts = response.split(/CONVERSATION_PLAN:/);
    if (parts.length < 2) return null;
    
    const planPart = parts[1].split(/ANALYSIS:/)[0];
    if (!planPart.trim()) return null;
    
    return planPart
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private extractChatResponse(apiResponse: any): string {
    const chatRule = this.apiConfig.rules.find(rule => rule.condition === "chat");
    if (!chatRule) {
      throw new Error("No chat rule found in configuration");
    }

    // Navigate the response object using the path
    const path = chatRule.path.split('.');
    let value = apiResponse;
    for (const key of path) {
      if (value === undefined || value === null) {
        throw new Error(`Invalid path ${chatRule.path} for response`);
      }
      value = value[key];
    }

    if (typeof value !== 'string') {
      throw new Error(`Chat response at path ${chatRule.path} is not a string`);
    }

    return value;
  }

  private validateResponseFormat(response: any): boolean {
    try {
      return this.validateStructure(response, this.apiConfig.outputFormat);
    } catch (error) {
      console.error('Response format validation failed:', error);
      return false;
    }
  }

  private validateStructure(obj: any, template: any): boolean {
    if (!obj || typeof obj !== 'object') return false;

    for (const [key, expectedType] of Object.entries(template)) {
      if (!(key in obj)) return false;

      if (typeof expectedType === 'object' && expectedType !== null) {
        if (!this.validateStructure(obj[key], expectedType)) return false;
      } else {
        if (obj[key] === undefined) return false;
      }
    }
    return true;
  }

  private validateCondition(response: any): boolean {
    try {
      const chatRule = this.apiConfig.rules.find(rule => rule.condition === "chat");
      if (!chatRule) return false;

      const chatResponse = this.extractChatResponse(response);
      return chatResponse.includes(chatRule.value);
    } catch (error) {
      console.error('Condition validation error:', error);
      return false;
    }
  }

  private async callEndpoint(input: Record<string, any>, signal?: AbortSignal): Promise<any> {
    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
        signal
      });
  
      if (!response.ok) {
        throw new Error(`Endpoint returned ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Endpoint call failed:', error);
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