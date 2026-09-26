"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Anfangs aktiver Tab (Default: erster) */
  defaultTabId?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTabId, className }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState<string>(defaultTabId ?? tabs[0]?.id ?? "");

  return (
    <div className={className}>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "-mb-px inline-flex min-h-touch items-center rounded-t px-4 text-sm font-bold uppercase tracking-kicker",
                active
                  ? "border-b-2 border-green-deep text-ink"
                  : "border-b-2 border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== activeId}
          className="pt-5"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
