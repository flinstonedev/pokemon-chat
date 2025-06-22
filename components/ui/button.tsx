import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "secondary"
    size?: "default" | "sm" | "lg"
}

export function Button({
    className,
    variant = "default",
    size = "default",
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
                {
                    "bg-blue-600 text-white hover:bg-blue-700": variant === "default",
                    "border border-gray-300 hover:bg-gray-100 hover:text-gray-900": variant === "outline",
                    "hover:bg-gray-100 hover:text-gray-900": variant === "ghost",
                    "bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
                },
                {
                    "h-10 py-2 px-4": size === "default",
                    "h-9 px-3 rounded-md": size === "sm",
                    "h-11 px-8 rounded-md": size === "lg",
                },
                className
            )}
            {...props}
        />
    )
} 