"use client";

import React, { useState, useEffect } from "react";
import { Badge, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
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

export default function ApiKeyConfig() {
  const [apiKey, setApiKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [activeModel, setActiveModel] = useState("");
  const [llmConfig, setLLMConfig] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ name: string; value: string }[]>([]);

  const providers = Object.values(LLMProvider);

  useEffect(() => {
    const storedConfig = localStorage.getItem("llm_config");
    if (storedConfig) {
      const config = JSON.parse(storedConfig);
      setLLMConfig(config);
      updateAvailableModels(config);
    }
    const storedModel = localStorage.getItem("active_model");
    if (storedModel) setActiveModel(storedModel);
  }, []);

  const formatModelName = (key: string): string => {
    const modelNames = {
      [AnthropicModel.Sonnet3_5]: "Claude 3.5 Sonnet",
      [OpenAIModel.GPT4]: "GPT-4",
      [OpenAIModel.GPT35Turbo]: "GPT-3.5 Turbo"
    };
    return modelNames[key as keyof typeof modelNames] || key;
  };

  const getModelsForProvider = (provider: string) => {
    const modelMapping = {
      [LLMProvider.Anthropic]: Object.values(AnthropicModel),
      [LLMProvider.OpenAI]: Object.values(OpenAIModel)
    };

    return modelMapping[provider as LLMProvider]?.map(value => ({
      name: formatModelName(value),
      value: value
    })) || [];
  };

  const updateAvailableModels = (config: Record<string, string>) => {
    const models: { name: string; value: string }[] = [];
    
    if (config[LLMProvider.Anthropic]) {
      models.push(...getModelsForProvider(LLMProvider.Anthropic));
    }
    
    if (config[LLMProvider.OpenAI]) {
      models.push(...getModelsForProvider(LLMProvider.OpenAI));
    }
    
    setAvailableModels(models);

    if (activeModel && !models.some(model => model.value === activeModel)) {
      setActiveModel('');
      localStorage.removeItem('active_model');
    }
  };

  const handleSave = () => {
    const newConfig = { ...llmConfig };
    newConfig[selectedProvider.toLowerCase()] = apiKey;
    
    localStorage.setItem("llm_config", JSON.stringify(newConfig));
    setLLMConfig(newConfig);
    updateAvailableModels(newConfig);
    setIsOpen(false);
    setApiKey("");
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
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>LLM Configuration</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <span>X</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {availableModels.length > 0 && (
            <div className="flex items-center space-x-2">
              <Label>Active Model:</Label>
              <Select
                value={activeModel}
                onValueChange={(value: string) => {
                  setActiveModel(value);
                  localStorage.setItem("active_model", value);
                }}
              >
                <SelectTrigger className="w-[180px] bg-black/40 border-zinc-800">
                  <SelectValue placeholder="Select active model" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-zinc-800">
                  {availableModels.map(({ name, value }) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Select LLM Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={(value: string) => {
                setSelectedProvider(value);
              }}
            >
              <SelectTrigger className="bg-black/40 border-zinc-800">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-zinc-800">
                {providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <p className="text-sm text-zinc-400 italic">
            * Your LLM Keys aren't stored in our servers
          </p>

          <div className="flex justify-between">
            <Button 
              onClick={handleSave} 
              className="w-full mr-2"
              disabled={!selectedProvider || !apiKey}
            >
              Save Configuration
            </Button>
            <Button
              onClick={() => {
                setIsOpen(false);
                setApiKey("");
                setSelectedProvider("");
              }}
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