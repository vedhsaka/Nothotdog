"use client";

import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnthropicModel, OpenAIModel, LLMProvider } from "@/services/llm/enums";

export default function LLMConfig() {
  const [apiKey, setApiKey] = useState("");
  const [selectedLLM, setSelectedLLM] = useState("");
  const [activeModel, setActiveModel] = useState("");
  const [llmConfig, setLLMConfig] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);

  const providers = Object.values(LLMProvider);

  useEffect(() => {
    const storedConfig = localStorage.getItem('llm_config');
    if (storedConfig) {
      setLLMConfig(JSON.parse(storedConfig));
    }
    const storedModel = localStorage.getItem('active_model');
    if (storedModel) setActiveModel(storedModel);
  }, []);

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

  const getAllAvailableModels = () => {
    const models: { name: string; value: string }[] = [];
    providers.forEach(provider => {
      getModelsForProvider(provider).forEach(model => {
        models.push(model);
      });
    });
    return models;
  };

  const handleSave = () => {
    const newConfig = { ...llmConfig };
    newConfig[selectedLLM.toLowerCase()] = apiKey;
    
    localStorage.setItem('llm_config', JSON.stringify(newConfig));
    setLLMConfig(newConfig);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-4 left-4 h-10 w-10"
          onClick={() => setIsOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <div className={`modal-overlay ${isOpen ? "block" : "hidden"}`} />
      <DialogContent className="sm:max-w-[425px] bg-black/90 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>LLM Configuration</span>
            <div className="flex items-center space-x-2">
              <Label>Active Model:</Label>
              <Select
                value={activeModel}
                onValueChange={(value: string) => {
                  setActiveModel(value);
                  localStorage.setItem('active_model', value);
                }}
              >
                <SelectTrigger className="w-[180px] bg-black/40 border-zinc-800">
                  <SelectValue placeholder="Select active model" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-zinc-800">
                  {getAllAvailableModels().map(({ name, value }) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
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

          {/* <Button 
            onClick={handleSave}
            className="w-full"
          >
            Save Configuration
          </Button> */}
          <div className="flex justify-between">
            <Button onClick={handleSave} className="w-full mr-2">
              Save Configuration
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
