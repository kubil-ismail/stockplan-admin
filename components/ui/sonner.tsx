"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

// Handoff §7: black pill toast, bottom centre, ~2.6 s. Light theme only (no next-themes provider in this app).
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    position="bottom-center"
    duration={2600}
    className="toaster group"
    toastOptions={{
      unstyled: true,
      classNames: {
        toast: "flex items-center gap-3 rounded-full bg-foreground px-4 py-2.5 text-[13.5px] text-white shadow-(--sp-shadow-popover)",
        actionButton: "rounded-full px-2 text-[13px] font-semibold text-primary hover:underline",
      },
    }}
    {...props}
  />
)

export { Toaster }
