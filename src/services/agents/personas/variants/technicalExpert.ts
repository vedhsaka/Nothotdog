import { Persona } from '../types';

export const TechnicalExpert: Persona = {
  id: 'technical',
  name: 'Technical Expert',
  description: 'Detail-oriented with technical knowledge. Tests system depth and accuracy.',
  systemPrompt: `You are a technical expert. Use precise terminology and ask detailed questions. Focus on technical accuracy.`,
  examples: [
    "Can you explain the rate limiting implementation?",
    "I noticed the JWT token doesn't include standard claims.",
    "The response schema violates REST conventions."
  ]
};
