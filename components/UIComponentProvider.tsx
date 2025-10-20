"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Action } from "@/lib/ui-action-schema";
import {
  createActionExecutor,
  type ActionExecutor,
  type ActionResult,
} from "@/lib/ui-action-executor";

/**
 * Component state for each interactive component
 */
interface ComponentState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  loading: boolean;
  error: string | null;
}

/**
 * UI component context value
 */
interface UIComponentContextValue {
  getComponentState: (componentId: string) => ComponentState;
  executeAction: (
    componentId: string,
    action: Action,
    context?: { actions?: Record<string, Action> }
  ) => Promise<ActionResult>;
  resetComponent: (componentId: string) => void;
  executor: ActionExecutor;
}

const UIComponentContext = createContext<UIComponentContextValue | null>(null);

/**
 * Provider configuration
 */
interface UIComponentProviderProps {
  children: ReactNode;
  mcpUrl?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCustomEvent?: (eventName: string, payload: any) => void | Promise<void>;
}

/**
 * Provider for UI component state management
 */
export const UIComponentProvider = ({
  children,
  mcpUrl,
  onCustomEvent,
}: UIComponentProviderProps) => {
  const [componentStates, setComponentStates] = useState<
    Map<string, ComponentState>
  >(new Map());

  // Create action executor
  const executor = useMemo(
    () =>
      createActionExecutor({
        mcpUrl,
        onCustomEvent,
      }),
    [mcpUrl, onCustomEvent]
  );

  /**
   * Get component state
   */
  const getComponentState = useCallback(
    (componentId: string): ComponentState => {
      return (
        componentStates.get(componentId) || {
          data: null,
          loading: false,
          error: null,
        }
      );
    },
    [componentStates]
  );

  /**
   * Execute action for component
   */
  const executeAction = useCallback(
    async (
      componentId: string,
      action: Action,
      context?: { actions?: Record<string, Action> }
    ): Promise<ActionResult> => {
      // Set loading state
      setComponentStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(componentId, {
          ...getComponentState(componentId),
          loading: true,
          error: null,
        });
        return newMap;
      });

      // Execute action
      const result = await executor.executeAction(action, componentId, context);

      // Update state with result
      setComponentStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(componentId, {
          data: result.success ? result.data : null,
          loading: false,
          error: result.success ? null : result.error || "Action failed",
        });
        return newMap;
      });

      return result;
    },
    [executor, getComponentState]
  );

  /**
   * Reset component state
   */
  const resetComponent = useCallback(
    (componentId: string) => {
      setComponentStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(componentId);
        return newMap;
      });
      executor.rateLimiter.reset(componentId);
    },
    [executor]
  );

  const value = useMemo<UIComponentContextValue>(
    () => ({
      getComponentState,
      executeAction,
      resetComponent,
      executor,
    }),
    [getComponentState, executeAction, resetComponent, executor]
  );

  return (
    <UIComponentContext.Provider value={value}>
      {children}
    </UIComponentContext.Provider>
  );
};

/**
 * Hook to access UI component context
 */
export const useUIComponent = () => {
  const context = useContext(UIComponentContext);
  if (!context) {
    throw new Error("useUIComponent must be used within UIComponentProvider");
  }
  return context;
};

/**
 * Hook for specific component state
 */
export const useComponentState = (componentId: string) => {
  const { getComponentState, executeAction, resetComponent } = useUIComponent();
  const state = getComponentState(componentId);

  const execute = useCallback(
    (action: Action, context?: { actions?: Record<string, Action> }) => {
      return executeAction(componentId, action, context);
    },
    [componentId, executeAction]
  );

  const reset = useCallback(() => {
    resetComponent(componentId);
  }, [componentId, resetComponent]);

  return {
    ...state,
    execute,
    reset,
  };
};
