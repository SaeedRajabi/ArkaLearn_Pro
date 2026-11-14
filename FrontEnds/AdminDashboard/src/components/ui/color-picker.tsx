
'use client';

import { cn } from "@/lib/utils";

interface ColorPickerProps {
    color: string;
    onChangeAction: (color: string) => void;
    className?: string;
}

export function ColorPicker({ color, onChangeAction, className }: ColorPickerProps) {
    return (
        <div className={cn("relative w-8 h-8 rounded-md border overflow-hidden cursor-pointer", className)}>
            <input
                type="color"
                value={color}
                onChange={(e) => onChangeAction(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
                className="w-full h-full"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}

    