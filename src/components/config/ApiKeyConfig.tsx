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
import { AnthropicModel } from '@/services/llm/enums';

export default function ApiKeyConfig() {
  const [keyName, setKeyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(AnthropicModel.Sonnet3_5);

  const handleSave = () => {
    // Save API key configuration
    localStorage.setItem('anthropic_api_key', apiKey);
    localStorage.setItem('anthropic_key_name', keyName);
    localStorage.setItem('anthropic_model', selectedModel);
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
          <DialogTitle>Add Anthropic Config</DialogTitle>
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
            <Label>Select model</Label>
            <Select
            value={selectedModel}
            onValueChange={(value: string) => setSelectedModel(value as AnthropicModel)}
            >
            <SelectTrigger className="bg-black/40 border-zinc-800">
                <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-zinc-800">
                <SelectItem value={AnthropicModel.Sonnet3_5}>
                Claude 3.5 Sonnet
                </SelectItem>
            </SelectContent>
            </Select>
          </div>

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