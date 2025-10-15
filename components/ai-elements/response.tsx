"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Custom paragraph component that uses div instead of p to avoid hydration errors
// when markdown contains block-level elements like images with wrappers
const CustomParagraph = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <div {...props} className="mb-4 last:mb-0">
    {children}
  </div>
);

// Custom list components with proper padding to prevent bullet overflow
const CustomOrderedList = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLOListElement>) => (
  <ol
    {...props}
    className={cn(
      "mb-4 ml-6 list-outside list-decimal whitespace-normal last:mb-0",
      props.className
    )}
  >
    {children}
  </ol>
);

const CustomUnorderedList = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => (
  <ul
    {...props}
    className={cn(
      "mb-4 ml-6 list-outside list-disc whitespace-normal last:mb-0",
      props.className
    )}
  >
    {children}
  </ul>
);

// Custom link component to handle links properly without fetch errors
const CustomLink = ({
  children,
  href,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If it's a download attribute, handle the download properly
    if (props.download && href) {
      e.preventDefault();
      e.stopPropagation();

      try {
        // Fetch the resource
        const response = await fetch(href);
        const blob = await response.blob();

        // Create a temporary URL for the blob
        const blobUrl = URL.createObjectURL(blob);

        // Create a temporary anchor and trigger download
        const tempLink = document.createElement("a");
        tempLink.href = blobUrl;
        tempLink.download =
          typeof props.download === "string" ? props.download : "download";
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);

        // Clean up the blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (error) {
        console.error("Download failed:", error);
        // Fallback: try opening in new tab
        window.open(href, "_blank");
      }
      return;
    }

    // If it's a data URL, let the browser handle it natively
    if (href?.startsWith("data:")) {
      e.stopPropagation();
      return;
    }

    // For external links, open in new tab
    if (href && !href.startsWith("#")) {
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <a
      {...props}
      href={href}
      onClick={handleClick}
      className={cn("text-primary hover:underline", props.className)}
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};

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
        ol: CustomOrderedList,
        ul: CustomUnorderedList,
        a: CustomLink,
        ...components,
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
