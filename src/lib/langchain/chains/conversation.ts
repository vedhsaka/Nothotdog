import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";
import { ConversationStep } from "@/types/test";
import { BufferMemory } from "langchain/memory";

export class ConversationChain {
  private model: ChatAnthropic;
  private memory: BufferMemory;
  private prompt: ChatPromptTemplate;
  
  constructor(apiKey: string) {
    console.log('Initializing ConversationChain');
    if (!apiKey) {
      throw new Error('API key is required for ConversationChain');
    }
    console.log('API key provided:', apiKey ? 'Yes' : 'No');

    this.model = new ChatAnthropic({
      modelName: "claude-3-sonnet-20240229",
      anthropicApiKey: apiKey,
      temperature: 0.7
    });

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output"
    });

    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful AI assistant focused on having natural conversations while maintaining context."],
      ["human", "{input}"],
    ]);
    
    console.log('ConversationChain initialized');
  }

  async call(input: string): Promise<string> {
    console.log('Calling ConversationChain with input:', input);
    
    try {
      const chain = RunnableSequence.from([
        {
          input: (input: string) => input,
          memory: async () => {
            const memoryResult = await this.memory.loadMemoryVariables({});
            return memoryResult.chat_history || [];
          }
        },
        this.prompt,
        this.model,
        new StringOutputParser()
      ]);

      console.log('Chain created, invoking...');
      const response = await chain.invoke(input);
      console.log('Chain response received');

      await this.memory.saveContext(
        { input },
        { output: response }
      );
      console.log('Context saved to memory');

      return response;
    } catch (error) {
      console.error('Error in ConversationChain:', error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    console.log('Resetting ConversationChain memory');
    await this.memory.clear();
  }
} 