import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number
}

export function Steps({ currentStep, className, ...props }: StepsProps) {
  const childrenArray = React.Children.toArray(props.children)
  const steps = childrenArray.filter((child) => React.isValidElement(child) && child.type === Step)

  return (
    <div className={cn("flex w-full", className)} {...props}>
      {steps.map((step, index) => {
        if (!React.isValidElement(step)) return null

        return React.cloneElement(step, {
          stepNumber: index,
          isActive: currentStep === index,
          isCompleted: currentStep > index,
          isLastStep: index === steps.length - 1,
        })
      })}
    </div>
  )
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  stepNumber?: number
  isActive?: boolean
  isCompleted?: boolean
  isLastStep?: boolean
}

export function Step({
  title,
  description,
  stepNumber = 0,
  isActive = false,
  isCompleted = false,
  isLastStep = false,
  className,
  ...props
}: StepProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        isLastStep ? "" : "border-b md:border-b-0 md:border-r",
        isActive ? "border-primary" : "border-muted-foreground/20",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 pb-4">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border text-center text-sm font-medium",
            isActive
              ? "border-primary bg-primary text-primary-foreground"
              : isCompleted
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/20 text-muted-foreground",
          )}
        >
          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNumber + 1}
        </div>
        <div className="flex flex-col">
          <div
            className={cn("text-sm font-medium", isActive || isCompleted ? "text-foreground" : "text-muted-foreground")}
          >
            {title}
          </div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </div>
    </div>
  )
}
