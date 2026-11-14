import { cn } from '@/lib/utils';

export function BlobBg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-primary', className)}
    >
      <path
        d="M848.5,663Q733,826,539.5,850.5Q346,875,223.5,702Q101,529,183.5,357.5Q266,186,432.5,200.5Q599,215,752.5,299Q906,383,923,521.5Q940,660,848.5,663Z"
        fill="currentColor"
      />
    </svg>
  );
}
