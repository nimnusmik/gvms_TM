import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderCardProps {
  title: string;
  description?: ReactNode;
  right?: ReactNode;
  variant?: "default" | "soft" | "dark";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageHeaderCard({
  title,
  description,
  right,
  variant = "default",
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderCardProps) {
  const variantClassName =
    variant === "dark"
      ? "border-slate-800 bg-slate-900 text-white"
      : variant === "soft"
        ? "border-slate-200/60 bg-slate-50 text-slate-900"
        : "border-slate-200/70 bg-white/90 text-slate-900";

  const descriptionTone =
    variant === "dark" ? "text-slate-200/80" : "text-slate-500";

  return (
    <div
      className={cn(
        "rounded-2xl border px-6 py-4 shadow-sm",
        variantClassName,
        className
      )}
    >
      <div className="flex min-h-[88px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1
            className={cn(
              "text-2xl font-bold tracking-tight",
              titleClassName
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn("mt-1 text-sm", descriptionTone, descriptionClassName)}
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
