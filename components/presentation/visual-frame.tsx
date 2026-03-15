"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PresentationVisualFrameProps {
  children: ReactNode;
  frameClassName?: string;
  contentClassName?: string;
  borderColor?: string;
  backgroundColor?: string;
  fixedAspect?: boolean;
  minHeightPx?: number;
  maxHeightPx?: number;
}

export function PresentationVisualFrame({
  children,
  frameClassName,
  contentClassName,
  borderColor,
  backgroundColor,
  fixedAspect = false,
  minHeightPx = 220,
  maxHeightPx,
}: PresentationVisualFrameProps) {
  return (
    <div
      className={cn("rounded-2xl border backdrop-blur-md p-4 md:p-6", frameClassName)}
      style={{
        borderColor,
        backgroundColor,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        className={cn(
          "rounded-xl overflow-auto",
          fixedAspect && "aspect-[16/9]",
          contentClassName
        )}
        style={{
          minHeight: minHeightPx ? `${minHeightPx}px` : undefined,
          maxHeight: maxHeightPx ? `${maxHeightPx}px` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
