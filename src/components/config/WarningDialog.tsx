"use client";
import React, { useState, useEffect } from "react";
import { TriangleAlert, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WarningDialogProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function WarningDialog({ isOpen, onClose }: WarningDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);

  useEffect(() => {
    setInternalIsOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setInternalIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={internalIsOpen} onOpenChange={setInternalIsOpen}>
      <div className={`modal-overlay ${isOpen ? "block" : "hidden"}`} />
      {/* <div className="fixed inset-0 bg-background/50 z-40" aria-hidden="true" />{" "} */}
      {/* Backdrop */}
      <DialogContent className="sm:max-w-[425px] border-border fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-semibold">
            <TriangleAlert className="mr-2 h-5 w-5 text-yellow-500" />
            LLM Keys not configured
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 w-8 h-8 rounded-full hover:bg-zinc-700/50"
              onClick={handleClose}
            >
              <span className="text-zinc-400">X</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="mb-4 text-sm text-zinc-400">
          Please navigate to Settings (
          <Settings className="inline w-4 h-4 mr-1" />) and set up your
          preferred LLM.
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
