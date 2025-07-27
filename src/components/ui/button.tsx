import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 pixel-button",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 pixel-button",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground pixel-button",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 pixel-button",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Web3/Retro variants
        cyber: "bg-gradient-primary text-primary-foreground hover:shadow-neon pixel-button glow-pulse font-bold uppercase tracking-wide",
        neon: "bg-gradient-secondary text-secondary-foreground hover:shadow-cyber pixel-button font-bold uppercase tracking-wide",
        pixel: "bg-card text-card-foreground border-2 border-neon-cyan hover:bg-neon-cyan hover:text-background pixel-button font-mono font-bold",
        retro: "bg-retro-orange text-background hover:bg-retro-orange/80 pixel-button font-bold uppercase tracking-widest",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-sm",
        sm: "h-9 px-3 rounded-sm",
        lg: "h-12 px-8 rounded-sm text-base",
        icon: "h-10 w-10 rounded-sm",
        xl: "h-14 px-10 rounded-sm text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
