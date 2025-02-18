import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BufferMemory } from "langchain/memory";
import { ModelFactory } from '@/services/llm/modelfactory';
import { AnthropicModel, OpenAIModel } from '@/services/llm/enums';
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SYSTEM_PROMPTS } from "@/services/prompts";
import { getModelProvider, castToModelType } from '@/utils/modelUtils';

export class ConversationChain {
  private model: BaseChatModel;
  private memory: BufferMemory;
  private prompt: ChatPromptTemplate;

  constructor(apiKey: string, activeModel?: string) {
    console.log('Initializing ConversationChain');
    if (!apiKey) {
      throw new Error('API key is required for ConversationChain');
    }
    console.log('API key provided:', apiKey ? 'Yes' : 'No');

    let selectedModel;
    if (activeModel) {
      selectedModel = castToModelType(activeModel);
    } else {
      selectedModel = AnthropicModel.Sonnet3_5; // Default fallback
    }

    this.model = ModelFactory.createLangchainModel(
      selectedModel,
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

    console.log('ConversationChain initialized with model:', selectedModel);
  }

  static async create(config?: { 
    llmConfig?: Record<string, string>,
    activeModel?: string 
  }): Promise<ConversationChain> {
    const activeModel = config?.activeModel || localStorage.getItem('active_model');
    if (!activeModel) {
      throw new Error('No active model selected');
    }

    const llmConfig = config?.llmConfig || 
      JSON.parse(localStorage.getItem('llm_config') || '{}');
    
    const provider = getModelProvider(activeModel);
    const apiKey = llmConfig[provider];

    if (!apiKey) {
      throw new Error(`No API key found for ${provider}`);
    }

    return new ConversationChain(apiKey, activeModel);
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