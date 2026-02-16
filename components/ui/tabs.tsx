'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Context
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

// Main Tabs Container
interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
}

export function Tabs({ defaultTab, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// Tab List (container for tab triggers)
interface TabListProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function TabList({ children, className, variant = 'default' }: TabListProps) {
  const baseStyles = {
    default: 'border-b border-gray-200',
    pills: 'bg-gray-100 p-1 rounded-lg',
    underline: 'border-b border-gray-200',
  };

  return (
    <div
      className={cn('flex gap-1', baseStyles[variant], className)}
      role="tablist"
    >
      {children}
    </div>
  );
}

// Individual Tab Trigger
interface TabTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: string | number;
  variant?: 'default' | 'pills' | 'underline';
}

export function TabTrigger({
  value,
  children,
  className,
  disabled = false,
  icon,
  badge,
  variant = 'default',
}: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  const variantStyles = {
    default: cn(
      'px-4 py-2.5 -mb-px border-b-2 transition-colors',
      isActive
        ? 'border-primary-600 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    ),
    pills: cn(
      'px-4 py-2 rounded-md transition-colors',
      isActive
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    ),
    underline: cn(
      'px-4 py-2.5 -mb-px border-b-2 transition-colors',
      isActive
        ? 'border-primary-600 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    ),
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'flex items-center gap-2 text-sm font-medium whitespace-nowrap',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            isActive
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// Tab Content Panel
interface TabContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabContent({ value, children, className }: TabContentProps) {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn('focus:outline-none', className)}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

// Simple Tabs Component (all-in-one)
interface SimpleTab {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  content: ReactNode;
  disabled?: boolean;
}

interface SimpleTabsProps {
  tabs: SimpleTab[];
  defaultTab?: string;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  contentClassName?: string;
  onChange?: (tab: string) => void;
}

export function SimpleTabs({
  tabs,
  defaultTab,
  variant = 'default',
  className,
  contentClassName,
  onChange,
}: SimpleTabsProps) {
  const initialTab = defaultTab || tabs[0]?.value;

  return (
    <Tabs defaultTab={initialTab} className={className} onChange={onChange}>
      <TabList variant={variant}>
        {tabs.map((tab) => (
          <TabTrigger
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            badge={tab.badge}
            disabled={tab.disabled}
            variant={variant}
          >
            {tab.label}
          </TabTrigger>
        ))}
      </TabList>

      {tabs.map((tab) => (
        <TabContent key={tab.value} value={tab.value} className={contentClassName}>
          {tab.content}
        </TabContent>
      ))}
    </Tabs>
  );
}
