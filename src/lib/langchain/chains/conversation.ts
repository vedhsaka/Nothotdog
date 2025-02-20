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
    if (!apiKey) {
      throw new Error('API key is required for ConversationChain');
    }

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

  }

  async call(input: string): Promise<string> {
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

      const response = await chain.invoke(input);

      await this.memory.saveContext(
        { input },
        { output: response }
      );

      return response;
    } catch (error) {
      console.error('Error in ConversationChain:', error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    await this.memory.clear();
  }
}