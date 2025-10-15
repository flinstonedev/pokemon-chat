import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "rounded-xl border backdrop-blur-md transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-surface-2 border-border/50 shadow-lg",
        strong: "bg-surface-3 border-border/60 shadow-xl",
        subtle: "bg-surface-1 border-border/40 shadow-md",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export type GlassCardProps = React.ComponentProps<"div"> &
  VariantProps<typeof glassCardVariants>;

export function GlassCard({
  className,
  variant,
  padding,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(glassCardVariants({ variant, padding, className }))}
      {...props}
    />
  );
}

export { glassCardVariants };
