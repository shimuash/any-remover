'use client';

import * as React from "react"
import * as ToolbarPrimitive from "@radix-ui/react-toolbar"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"
import { buttonVariants } from "@/components/ui/button"

/**
 * Context for sharing variant and size props across Toolbar components
 */
const ToolbarContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

/**
 * Toolbar Root component
 */
function Toolbar({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      className={cn(
        "flex min-w-max items-center gap-1 bg-background w-fit rounded-2xl px-2.5 py-1 shadow-lg",
        className
      )}
      {...props}
    >
      <ToolbarContext.Provider value={{ variant, size }}>
        {children}
      </ToolbarContext.Provider>
    </ToolbarPrimitive.Root>
  )
}

/**
 * Toolbar Separator component
 */
function ToolbarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn("mx-1 h-5 w-px shrink-0 bg-border", className)}
      {...props}
    />
  )
}

/**
 * Toolbar Button component
 */
function ToolbarButton({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Button> &
  VariantProps<typeof buttonVariants>) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(
        buttonVariants({
          variant: variant,
          size: size,
        }),
        className
      )}
      {...props}
    />
  )
}

/**
 * Toolbar Link component
 */
function ToolbarLink({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Link> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToolbarContext)

  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(
        toggleVariants({
          variant: variant || context.variant,
          size: size || context.size,
        }),
        "cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

/**
 * Toolbar ToggleGroup component
 */
function ToolbarToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.ToggleGroup> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToolbarContext)

  return (
    <ToolbarPrimitive.ToggleGroup
      data-slot="toolbar-toggle-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <ToolbarContext.Provider
        value={{
          variant: variant || context.variant,
          size: size || context.size,
        }}
      >
        {children}
      </ToolbarContext.Provider>
    </ToolbarPrimitive.ToggleGroup>
  )
}

/**
 * Toolbar ToggleItem component
 */
function ToolbarToggleItem({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.ToggleItem> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToolbarContext)

  return (
    <ToolbarPrimitive.ToggleItem
      data-slot="toolbar-toggle-item"
      className={cn(
        toggleVariants({
          variant: variant || context.variant,
          size: size || context.size,
        }),
        'hover:text-foreground',
        className
      )}
      {...props}
    />
  )
}

export {
  Toolbar,
  ToolbarSeparator,
  ToolbarButton,
  ToolbarLink,
  ToolbarToggleGroup,
  ToolbarToggleItem,
}
