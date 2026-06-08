"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { cn } from "@/lib/utils";

interface VehicleAutocompleteProps {
  items: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function VehicleAutocomplete({
  items,
  value,
  onValueChange,
  placeholder,
  inputClassName,
  disabled,
}: VehicleAutocompleteProps) {
  return (
    <Autocomplete.Root
      items={items}
      value={value}
      onValueChange={onValueChange}
      openOnInputClick
      autoHighlight
    >
      <Autocomplete.Input
        className={inputClassName}
        placeholder={placeholder}
        disabled={disabled}
      />

      <Autocomplete.Portal>
      <Autocomplete.Positioner sideOffset={6} align="start">
        <Autocomplete.Popup
          className={cn(
            "z-50 max-h-72 min-w-56 overflow-y-auto rounded-md border bg-popover py-1 shadow-md",
            "data-ending-style:animate-none",
          )}
        >
          <Autocomplete.Empty className="px-3 py-2 text-sm text-muted-foreground">
            No results
          </Autocomplete.Empty>

          {items.map((item) => (
            <Autocomplete.Item
              key={item}
              value={item}
              className="cursor-pointer px-3 py-2 text-sm text-popover-foreground outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
            >
              {item}
            </Autocomplete.Item>
          ))}
        </Autocomplete.Popup>
      </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
