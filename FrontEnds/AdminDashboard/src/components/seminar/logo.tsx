import { cn } from '@/lib/utils';

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-primary', className)}
    >
      <path
        d="M16 3L3 10.2V21.8L16 29L29 21.8V10.2L16 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M23 18C23 18.9319 22.6996 19.8298 22.1642 20.5355C21.6288 21.2413 20.8993 21.7145 20.1 21.87V14.13C20.8993 14.2855 21.6288 14.7587 22.1642 15.4645C22.6996 16.1702 23 17.0681 23 18Z"
        fill="currentColor"
      />
      <path
        d="M9 18C9 16.5272 9.83531 15.2239 11.134 14.5355L11.1337 21.4641C9.83515 20.7758 9 19.4728 9 18Z"
        fill="hsl(var(--accent))"
      />
      <path
        d="M12.866 21.866V14.134L18.866 10.134L20.1 14.13V21.87L18.866 25.866L12.866 21.866Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoIcon className={cn(light ? 'text-primary-foreground' : 'text-primary')} />
      <span
        className={cn(
          'font-headline text-xl font-bold tracking-tight',
          light ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        EduCentral
      </span>
    </div>
  );
}
