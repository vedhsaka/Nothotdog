"use client";

import React, { useState } from "react";
import { Settings } from "lucide-react";
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
import { AnthropicModel } from "@/services/llm/enums";

export default function ApiKeyConfig() {
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(AnthropicModel.Sonnet3_5);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    localStorage.setItem("anthropic_api_key", apiKey);
    localStorage.setItem("anthropic_key_name", keyName);
    localStorage.setItem("anthropic_model", selectedModel);
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
      <DialogContent className="sm:max-w-[425px] bg-background/90 border-border">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>Add Anthropic Config</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <span>X</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="keyName">API key name</Label>
            <Input
              id="keyName"
              placeholder="Key name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="border border-border bg-background"
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
              className="border border-border bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label>Select model</Label>
            <Select
              value={selectedModel}
              onValueChange={(value: string) =>
                setSelectedModel(value as AnthropicModel)
              }
            >
              <SelectTrigger className="border border-border bg-background">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-background/90 border-border">
                <SelectItem value={AnthropicModel.Sonnet3_5}>
                  Claude 3.5 Sonnet
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
