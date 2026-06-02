import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// NOTA Sprint 0: Button placeholder SIN @radix-ui/react-slot (asChild). Radix se
// reintroduce con la UI real en Sprint 1; mantenerlo fuera aquí evita arrastrar
// una segunda copia de @types/react al árbol de tipos de la web.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Chrome del producto = AZUL.
        default: 'bg-product text-white hover:bg-product-deep',
        outline: 'border border-product text-product hover:bg-product-muted',
        ghost: 'hover:bg-product-muted text-product',
      },
      size: {
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        sm: 'h-9 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
