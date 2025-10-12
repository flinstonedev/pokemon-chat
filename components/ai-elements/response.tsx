"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Custom paragraph component that uses div instead of p to avoid hydration errors
// when markdown contains block-level elements like images with wrappers
const CustomParagraph = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <div {...props} className="mb-4 last:mb-0">
    {children}
  </div>
);

export const Response = memo(
  ({ className, components, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      controls={false}
      components={{
        p: CustomParagraph,
        ...components,
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
