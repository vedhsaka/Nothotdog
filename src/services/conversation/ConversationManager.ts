import { ConversationStep, ConversationContext, TestScenario, SavedTest } from "@/types/test";

export class ConversationManager {
  private steps: ConversationStep[];
  private currentStepIndex: number;
  private maxRetries = 3;
  private retryDelay = 1000;
  private testConfig: SavedTest;
  private context: ConversationContext = {
    variables: {},
    messageHistory: [],
    currentPath: [],
    metrics: {
      responseTime: [],
      validationScores: [],
      contextRelevance: []
    }
  };

  constructor(testConfig: SavedTest) {
    if (!testConfig || !testConfig.agentEndpoint) {
      throw new Error('Test configuration is required');
    }
    this.testConfig = testConfig;
    this.steps = [];
    this.currentStepIndex = 0;
  }

  private async makeApiCall(messages: { role: string; content: string }[]): Promise<string> {
    try {
      // Get the current message content
      const currentMessage = messages[messages.length - 1].content;

      // Parse the saved input format
      const inputTemplate = JSON.parse(this.testConfig.input);
      
      // Find the field that contains the message placeholder and replace it
      const requestBody = Object.fromEntries(
        Object.entries(inputTemplate).map(([key, value]) => {
          if (typeof value === 'string' && value.includes('{{message}}')) {
            return [key, value.replace('{{message}}', currentMessage)];
          }
          return [key, value];
        })
      );

      const response = await fetch(this.testConfig.agentEndpoint, {
        method: 'POST',
        headers: this.testConfig.headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || data.output || data.content || '';
    } catch (error: any) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  private async validateResponse(response: string, expectedBehavior: string): Promise<number> {
    // Simple validation against expected behavior/output
    const lowerResponse = response.toLowerCase();
    const lowerExpected = expectedBehavior.toLowerCase();
    
    // Check if response contains or matches expected behavior
    return lowerResponse.includes(lowerExpected) ? 1.0 : 0.0;
  }

  async executeStep(step: ConversationStep): Promise<{
    response: string;
    isValid: boolean;
    metrics: {
      responseTime: number;
      validationScore: number;
      contextRelevance: number;
    };
  }> {
    const startTime = Date.now();
    
    try {
      // Include full conversation history for context
      const messages = this.context.messageHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add current step
      messages.push({
        role: 'user',
        content: step.content
      });

      const response = await this.makeApiCall(messages);
      const responseTime = Date.now() - startTime;
      
      // Validate response if validation criteria exists
      const validationScore = step.validation?.criteria ? 
        await this.validateResponse(response, step.validation.criteria) : 1.0;
      
      // Update conversation history
      this.context.messageHistory.push({
        ...step,
        response
      });
      
      return {
        response,
        isValid: validationScore >= 0.7,
        metrics: {
          responseTime,
          validationScore,
          contextRelevance: 1.0 // Simplified for now
        }
      };
    } catch (error: any) {
      throw new Error(`Step execution failed: ${error.message}`);
    }
  }

  setConversation(scenario: TestScenario) {
    // Convert scenario into conversation steps
    this.steps = [{
      id: scenario.steps[0].id,
      role: 'user',
      content: 'Hello', // Initial greeting
      validation: { criteria: 'Should respond politely', stopOnFailure: false }
    }, {
      id: scenario.steps[0].id,
      role: 'user',
      content: scenario.steps[0].content, // Main scenario question
      validation: scenario.steps[0].validation
    }];
    
    this.currentStepIndex = 0;
    this.context.messageHistory = [];
  }

  async executeConversation(): Promise<{
    success: boolean;
    metrics: ConversationContext['metrics'];
    history: ConversationStep[];
  }> {
    const executedSteps: ConversationStep[] = [];
    let allValid = true;

    try {
      for (const step of this.steps) {
        const result = await this.executeStep(step);
        
        executedSteps.push({
          ...step,
          response: result.response,
          metrics: result.metrics
        });

        if (!result.isValid && step.validation?.stopOnFailure) {
          allValid = false;
          break;
        }

        this.currentStepIndex++;
      }

      return {
        success: allValid,
        metrics: this.context.metrics,
        history: executedSteps
      };
    } catch (error) {
      throw error;
    }
  }
} 