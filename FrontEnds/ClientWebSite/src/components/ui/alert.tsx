import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  [
    "relative w-full rounded-xl border px-4 py-3.5 text-sm shadow-sm backdrop-blur-sm",
    "[&>svg~*]:ps-7 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4 [&>svg]:text-foreground",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-border/70 bg-background/95 text-foreground",
        success:
          "border-emerald-500/25 bg-emerald-50/90 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-950/50 dark:text-emerald-50 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        info:
          "border-primary/25 bg-primary/10 text-foreground [&>svg]:text-primary",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/15 [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-relaxed opacity-90 [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
