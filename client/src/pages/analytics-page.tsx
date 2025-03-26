import { Sidebar } from "@/components/ui/sidebar";
import { AnalyticsView } from "@/components/analytics/analytics-chart";

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-[#2C3E50] sm:text-3xl sm:truncate font-display">
                Analytics & Trends
              </h1>
            </div>
          </div>

          {/* Analytics View */}
          <div className="mt-8">
            <AnalyticsView />
          </div>
        </div>
      </main>
    </div>
  );
}
