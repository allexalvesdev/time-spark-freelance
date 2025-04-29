
import * as React from "react";
import { Check, ChevronDown, AlertTriangle, AlertCircle, Alert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PriorityType = "Low" | "Medium" | "High" | "Urgent";

interface PrioritySelectorProps {
  value: PriorityType;
  onChange: (priority: PriorityType) => void;
  className?: string;
}

const priorityConfig: Record<PriorityType, { icon: React.ReactNode, color: string, bgColor: string }> = {
  Low: {
    icon: <Alert className="h-3.5 w-3.5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20"
  },
  Medium: {
    icon: <Alert className="h-3.5 w-3.5" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
  },
  High: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20"
  },
  Urgent: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/20"
  }
};

export function PrioritySelector({ value, onChange, className }: PrioritySelectorProps) {
  const config = priorityConfig[value];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <Badge className={cn("h-6 gap-1", config.bgColor, config.color)}>
              {config.icon}
              <span>{value}</span>
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {(Object.keys(priorityConfig) as PriorityType[]).map((priority) => {
          const priorityData = priorityConfig[priority];
          return (
            <DropdownMenuItem
              key={priority}
              className="flex items-center gap-2"
              onSelect={() => onChange(priority)}
            >
              <Badge className={cn("h-6 gap-1", priorityData.bgColor, priorityData.color)}>
                {priorityData.icon}
                <span>{priority}</span>
              </Badge>
              {priority === value && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
