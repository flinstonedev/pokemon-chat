import React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps {
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<
    React.ElementRef<'div'>,
    SeparatorProps
>(({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'shrink-0',
            orientation === 'horizontal'
                ? 'h-px w-full border-t border-gray-200'
                : 'h-full w-px border-l border-gray-200',
            className
        )}
        {...props}
    />
));

Separator.displayName = 'Separator';

export { Separator }; 