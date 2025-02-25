import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex h-[100px] w-full rounded-[10px] border border-[#E5FFA9] bg-background px-3 pb-2 pt-[18px] text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#93D400] focus:border-[#93D400] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
