"use client";

import React from "react";
import * as LucideIcons from "lucide-react";

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  className = "w-5 h-5",
  size = 20,
}) => {
  const Component =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{ className?: string; size?: number }>
      >
    )[name] || LucideIcons.CircleHelp;
  return <Component className={className} size={size} />;
};
