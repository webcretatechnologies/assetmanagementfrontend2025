"use client";

import { useEffect, useRef } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface AutoSelectOption {
    value: string;
    label: string;
}

interface AutoSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: AutoSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * AutoSelect - A dropdown that automatically selects and disables
 * when only one option is available.
 */
export function AutoSelect({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    disabled = false,
    className,
}: AutoSelectProps) {
    const hasAutoSelected = useRef(false);

    // Auto-select when only one option is available
    useEffect(() => {
        if (options.length === 1 && !hasAutoSelected.current) {
            const singleOption = options[0];
            if (value !== singleOption.value) {
                onValueChange(singleOption.value);
            }
            hasAutoSelected.current = true;
        } else if (options.length !== 1) {
            hasAutoSelected.current = false;
        }
    }, [options, value, onValueChange]);

    // Determine if dropdown should be disabled
    const isDisabled = disabled || options.length === 1;
    const hasOnlyOneOption = options.length === 1;

    return (
        <Select
            value={value}
            onValueChange={onValueChange}
            disabled={isDisabled}
        >
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/**
 * Hook to compute auto-select props for any options array.
 * Returns the value (auto-selected if single) and disabled state.
 */
export function useAutoSelect<T extends { id: string }>(
    items: T[],
    currentValue: string,
    setValue: (value: string) => void
) {
    const hasAutoSelected = useRef(false);

    useEffect(() => {
        if (items.length === 1 && !hasAutoSelected.current) {
            const singleItem = items[0];
            if (currentValue !== singleItem.id) {
                setValue(singleItem.id);
            }
            hasAutoSelected.current = true;
        } else if (items.length !== 1) {
            hasAutoSelected.current = false;
        }
    }, [items, currentValue, setValue]);

    return {
        shouldDisable: items.length === 1,
        hasSingleOption: items.length === 1,
    };
}

/**
 * Hook for filter dropdowns that have an "all" option.
 * When only one item exists, auto-selects that specific item and disables dropdown.
 * Does NOT select "all" - instead selects the single available item.
 */
export function useAutoSelectWithAll<T extends { id: string }>(
    items: T[],
    currentValue: string,
    setValue: (value: string) => void
) {
    const hasAutoSelected = useRef(false);

    useEffect(() => {
        if (items.length === 1 && !hasAutoSelected.current) {
            const singleItem = items[0];
            // Auto-select the single item (not "all")
            if (currentValue !== singleItem.id) {
                setValue(singleItem.id);
            }
            hasAutoSelected.current = true;
        } else if (items.length !== 1) {
            hasAutoSelected.current = false;
        }
    }, [items, currentValue, setValue]);

    return {
        shouldDisable: items.length === 1,
        hasSingleOption: items.length === 1,
    };
}
