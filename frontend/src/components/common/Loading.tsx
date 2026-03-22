import { cn } from '@/lib/utils/cn';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink';
}

export function Loading({ className, size = 'md', color = 'red' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  const colorClasses = {
    blue: 'border-t-blue-600',
    red: 'border-t-red-600',
    green: 'border-t-green-600',
    yellow: 'border-t-yellow-600',
    purple: 'border-t-purple-600',
    pink: 'border-t-pink-600',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-gray-200',
          colorClasses[color],
          sizeClasses[size],
        )}
      />
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
