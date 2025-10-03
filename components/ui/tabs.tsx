import React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

const TabsContext = React.createContext<{ value: string; onValueChange: (value: string) => void } | null>(null);

const Tabs = React.forwardRef<
    React.ElementRef<'div'>,
    TabsProps
>(({ value, onValueChange, children, className, ...props }, ref) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
            {children}
        </div>
    </TabsContext.Provider>
));

const TabsList = React.forwardRef<
    React.ElementRef<'div'>,
    TabsListProps
>(({ children, className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
    >
        {children}
    </div>
));

const TabsTrigger = React.forwardRef<
    React.ElementRef<'button'>,
    TabsTriggerProps
>(({ value, children, className, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = context.value === value;

    return (
        <button
            ref={ref}
            onClick={() => context.onValueChange(value)}
            className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                    ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

const TabsContent = React.forwardRef<
    React.ElementRef<'div'>,
    TabsContentProps
>(({ value, children, className, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    if (context.value !== value) return null;

    return (
        <div ref={ref} className={cn('mt-2', className)} {...props}>
            {children}
        </div>
    );
});

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent }; 