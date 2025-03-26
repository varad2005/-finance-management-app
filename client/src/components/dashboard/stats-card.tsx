import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  trend?: string;
  trendDirection?: "up" | "down";
  period?: string;
  subtext?: string;
  secondaryText?: string;
  percentage: number;
}

export function StatsCard({
  title,
  value,
  trend,
  trendDirection,
  period,
  subtext,
  secondaryText,
  percentage,
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="px-4 py-5 sm:p-6">
        <dl>
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
          <dd className="mt-1 text-3xl font-semibold text-[#2C3E50] dark:text-gray-100 font-display">
            {value}
          </dd>
        </dl>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">{period || subtext}</span>
            {trend && (
              <span
                className={cn(
                  "text-sm font-medium",
                  trendDirection === "up" ? "text-[#057642] dark:text-green-400" : "text-[#FF6B6B] dark:text-red-400"
                )}
              >
                {trend}
              </span>
            )}
            {secondaryText && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{secondaryText}</span>}
          </div>
          <div className="mt-1 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className={cn(
                "h-1 rounded-full",
                trendDirection === "down" ? "bg-[#FF6B6B] dark:bg-red-500" : "bg-[#057642] dark:bg-green-500",
                !trendDirection && "bg-[#0A66C2] dark:bg-blue-500",
                !trend && !trendDirection && "bg-gray-500 dark:bg-gray-400"
              )}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
