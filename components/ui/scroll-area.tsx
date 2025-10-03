import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps {
    className?: string;
    children: React.ReactNode;
}

const ScrollArea = React.forwardRef<
    React.ElementRef<'div'>,
    ScrollAreaProps
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('overflow-auto', className)}
        {...props}
    >
        {children}
    </div>
));

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea }; 