import type { ReactNode, CSSProperties } from 'react';

interface BlockLoadingProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function BlockLoading({ children, className = '', style }: BlockLoadingProps) {
  return (
    <div
      className={`flex h-[500px] items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-neutral-800 ${className}`}
      style={style}
    >
      {children || (
        <div className="flex flex-col items-center gap-3">
          <div className="loading-spinner"></div>
          <span>Loading Excalidraw...</span>
        </div>
      )}
    </div>
  );
}