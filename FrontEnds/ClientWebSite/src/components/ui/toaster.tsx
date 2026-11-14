"use client"

import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

function ToastIcon({ variant }: { variant?: string | null }) {
  const iconClass = "mt-0.5 h-5 w-5 shrink-0"
  if (variant === "destructive") {
    return <AlertCircle className={cn(iconClass, "text-destructive")} aria-hidden />
  }
  if (variant === "success") {
    return <CheckCircle2 className={cn(iconClass, "text-emerald-600 dark:text-emerald-400")} aria-hidden />
  }
  if (variant === "info") {
    return <Info className={cn(iconClass, "text-primary")} aria-hidden />
  }
  return <Info className={cn(iconClass, "text-muted-foreground")} aria-hidden />
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={5200} swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <ToastIcon variant={variant} />
            <div className="grid min-w-0 flex-1 gap-1 text-start">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
