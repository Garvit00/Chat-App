// components/ui/sonner.jsx
"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  const { theme = "system" } = useTheme() || {};
  return (
    <Sonner
      theme={theme}
      position="top-right"
      {...props}
    />
  );
}
