import { cn } from '@/lib/utils/cn';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink';
}

export function Loading({ className, size = 'md', color = 'blue' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          `animate-spin rounded-full border-gray-200 border-t-${color}-600 z-index-1`,
          sizeClasses[size],
        )}
      />
      {/* <span className='ml-2 text-black z-index-2'>読み込み中...</span> */}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
    />
  );
}
