import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  className?: string;
}

export function LoadingSpinner({
  size = 24,
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex justify-center items-center", className)} {...props}>
      <Loader2 className="animate-spin text-primary" size={size} />
    </div>
  );
}
