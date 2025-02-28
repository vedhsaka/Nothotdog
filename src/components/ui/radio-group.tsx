"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div className={cn("flex gap-2", className)} ref={ref} {...props} />
      </RadioGroupContext.Provider>
    )
  },
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isActive = value === context.value

    return (
      <Button
        ref={ref}
        type="button"
        variant={isActive ? "default" : "outline"}
        className={cn("px-3 py-1 h-auto", className)}
        onClick={() => context.onValueChange(value)}
        {...props}
      >
        {children}
      </Button>
    )
  },
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }

