'use client';

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnthropicModel, OpenAIModel, LLMProvider } from '@/services/llm/enums';

export default function LLMConfig() {
  const [keyName, setKeyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedLLM, setSelectedLLM] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const providers = Object.values(LLMProvider);

  // Helper function to format model names
  const formatModelName = (key: string): string => {
    switch (key) {
      case AnthropicModel.Sonnet3_5:
        return 'Claude 3.5 Sonnet';
      case OpenAIModel.GPT4:
        return 'GPT-4';
      case OpenAIModel.GPT35Turbo:
        return 'GPT-3.5 Turbo';
      default:
        return key;
    }
  };

  // Helper function to get available models for a provider
  const getModelsForProvider = (provider: string) => {
    switch (provider.toLowerCase()) {
      case LLMProvider.Anthropic:
        return Object.values(AnthropicModel).map(value => ({
          name: formatModelName(value),
          value: value
        }));
      case LLMProvider.OpenAI:
        return Object.values(OpenAIModel).map(value => ({
          name: formatModelName(value),
          value: value
        }));
      default:
        return [];
    }
  };

  const handleSave = () => {
    localStorage.setItem('llm_provider', selectedLLM.toLowerCase());
    localStorage.setItem('llm_key', apiKey);
    localStorage.setItem('llm_model', selectedModel);
    localStorage.setItem('llm_key_name', keyName);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-4 left-4 h-10 w-10"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black/90 border-zinc-800">
        <DialogHeader>
          <DialogTitle>LLM Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="keyName">API key name</Label>
            <Input
              id="keyName"
              placeholder="Key name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="bg-black/40 border-zinc-800"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-black/40 border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label>Select LLM Provider</Label>
            <Select
              value={selectedLLM}
              onValueChange={(value: string) => {
                setSelectedLLM(value);
                setSelectedModel('');
              }}
            >
              <SelectTrigger className="bg-black/40 border-zinc-800">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-zinc-800">
                {providers.map((provider) => (
                  <SelectItem 
                    key={provider} 
                    value={provider}
                  >
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLLM && (
            <div className="space-y-2">
              <Label>Select Model</Label>
              <Select
                value={selectedModel}
                onValueChange={(value: string) => setSelectedModel(value)}
              >
                <SelectTrigger className="bg-black/40 border-zinc-800">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-zinc-800">
                  {getModelsForProvider(selectedLLM).map(({ name, value }) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleSave}
            className="w-full"
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}