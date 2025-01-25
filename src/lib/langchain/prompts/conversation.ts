import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ConversationContext } from "@/types/context";

export const createConversationPrompt = (systemPrompt: string) => {
  return ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"]
  ]);
};

export const createTestConversationPrompt = (context: ConversationContext) => {
  const contextStr = JSON.stringify(context, null, 2);
  
  return ChatPromptTemplate.fromMessages([
    ["system", `You are an AI assistant participating in a test conversation. 
    Current conversation context: ${contextStr}
    
    Follow these guidelines:
    1. Maintain consistency with previous responses
    2. Consider the conversation context and variables
    3. Stay within the defined test parameters
    4. Provide responses that can be validated against test criteria`],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"]
  ]);
};

export const createValidationPrompt = () => {
  return ChatPromptTemplate.fromMessages([
    ["system", `You are a validation assistant. Analyze the conversation response 
    against the expected criteria and provide a validation score between 0 and 1.
    
    Consider:
    1. Response relevance
    2. Adherence to context
    3. Fulfillment of test requirements
    4. Consistency with conversation history`],
    ["human", `Response to validate: {response}
    Expected criteria: {criteria}
    Previous context: {context}
    
    Provide a validation score and brief explanation.`]
  ]);
}; 