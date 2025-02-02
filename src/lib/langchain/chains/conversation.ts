import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BufferMemory } from "langchain/memory";
import { ModelFactory } from '@/services/llm/modelfactory';
import { AnthropicModel } from '@/services/llm/enums';
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SYSTEM_PROMPTS } from "@/services/prompts";

export class ConversationChain {
  private model: BaseChatModel;
  private memory: BufferMemory;
  private prompt: ChatPromptTemplate;

  constructor(apiKey: string) {
    console.log('Initializing ConversationChain');
    if (!apiKey) {
      throw new Error('API key is required for ConversationChain');
    }
    console.log('API key provided:', apiKey ? 'Yes' : 'No');

    this.model = ModelFactory.createLangchainModel(
      AnthropicModel.Sonnet3_5,
      apiKey
    );

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output"
    });

    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPTS.CONVERSATION_ASSISTANT],
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