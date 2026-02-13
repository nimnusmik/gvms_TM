import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderCardProps {
  title: string;
  description?: ReactNode;
  right?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageHeaderCard({
  title,
  description,
  right,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 bg-white/90 px-6 py-6 shadow-sm",
        className
      )}
    >
      <div className="flex min-h-[112px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1
            className={cn(
              "text-2xl font-bold tracking-tight text-slate-900",
              titleClassName
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn("mt-1 text-sm text-slate-500", descriptionClassName)}
            >
              {description}
            </p>
          ) : null}
        </div>
        {right ? (
          <div className="flex flex-wrap items-center gap-3">{right}</div>
        ) : null}
      </div>
    </div>
  );
}
