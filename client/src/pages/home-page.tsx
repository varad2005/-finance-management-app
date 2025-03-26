import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AddJobModal } from "@/components/job/add-job-modal";
import { JobBoard } from "@/components/job/job-board";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Calendar } from "@/components/calendar/calendar-view";
import { DocumentsList } from "@/components/documents/document-card";
import { AnalyticsView } from "@/components/analytics/analytics-chart";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalApplications: number;
  interviewsScheduled: number;
  responseRate: number;
  daysInSearch: number;
  applicationsByStatus: {
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("applications");
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-[#2C3E50] dark:text-gray-100 sm:text-3xl sm:truncate font-display">
                Dashboard
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button onClick={() => setIsAddJobModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Job
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoadingStats ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              <>
                <StatsCard
                  title="Total Applications"
                  value={stats?.totalApplications || 0}
                  trend="+12.5%"
                  trendDirection="up"
                  period="30 days"
                  percentage={45}
                />
                <StatsCard
                  title="Interviews Secured"
                  value={stats?.interviewsScheduled || 0}
                  trend="+8.2%"
                  trendDirection="up"
                  period="30 days"
                  percentage={33}
                />
                <StatsCard
                  title="Response Rate"
                  value={`${stats?.responseRate || 0}%`}
                  trend="-2.3%"
                  trendDirection="down"
                  period="30 days"
                  percentage={stats?.responseRate || 0}
                />
                <StatsCard
                  title="Days in Search"
                  value={stats?.daysInSearch || 0}
                  subtext="Avg. Response: 8d"
                  secondaryText="+4 today"
                  percentage={76}
                />
              </>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Tabs defaultValue="applications" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4 dark:bg-gray-800">
                <TabsTrigger value="applications" className="py-4 data-[state=active]:dark:bg-gray-700 dark:text-gray-200">Applications</TabsTrigger>
                <TabsTrigger value="calendar" className="py-4 data-[state=active]:dark:bg-gray-700 dark:text-gray-200">Calendar</TabsTrigger>
                <TabsTrigger value="documents" className="py-4 data-[state=active]:dark:bg-gray-700 dark:text-gray-200">Documents</TabsTrigger>
                <TabsTrigger value="analytics" className="py-4 data-[state=active]:dark:bg-gray-700 dark:text-gray-200">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-6">
                <JobBoard />
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <Calendar />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentsList />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <AnalyticsView />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <AddJobModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
      />
    </div>
  );
}
