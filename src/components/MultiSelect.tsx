import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-64 h-12 justify-between"
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : `${selected.length} sélectionné${selected.length > 1 ? "s" : ""}`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filtres</span>
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 px-2 text-xs"
              >
                Tout effacer
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-secondary transition-colors",
                  isSelected && "bg-primary/10"
                )}
              >
                <span className="text-sm">{option}</span>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </div>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {selected.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  <span className="text-xs">{item}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(item);
                    }}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
