import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { JobCard } from "./job-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { JobApplication } from "@shared/schema";

export function JobBoard() {
  const { toast } = useToast();
  const [draggedJob, setDraggedJob] = useState<JobApplication | null>(null);
  
  const { data: jobs, isLoading, error } = useQuery<JobApplication[]>({
    queryKey: ["/api/applications"],
  });
  
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/applications/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status updated",
        description: "Job application status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLElement) {
        const jobId = e.target.closest('[data-job-id]')?.getAttribute('data-job-id');
        if (jobId && jobs) {
          const job = jobs.find(j => j.id.toString() === jobId);
          if (job) {
            setDraggedJob(job);
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = 'move';
            }
          }
        }
      }
    };
    
    document.addEventListener('dragstart', handleDragStart);
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [jobs]);
  
  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedJob && draggedJob.status !== status) {
      updateJobStatusMutation.mutate({ id: draggedJob.id, status });
    }
    setDraggedJob(null);
  };
  
  const appliedJobs = jobs?.filter(job => job.status === "applied") || [];
  const interviewJobs = jobs?.filter(job => job.status === "interview") || [];
  const offerJobs = jobs?.filter(job => job.status === "offer") || [];
  const rejectedJobs = jobs?.filter(job => job.status === "rejected") || [];
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 dark:text-red-400">Error loading job applications: {error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Applied Column */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow kanban-column transition-all duration-300 hover:shadow-md"
        onDragOver={(e) => handleDragOver(e, "applied")}
        onDrop={(e) => handleDrop(e, "applied")}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-display text-lg font-medium text-[#2C3E50] dark:text-gray-200 flex items-center">
            Applied <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 px-2 rounded-full text-xs">{appliedJobs.length}</span>
          </h3>
        </div>
        <div className="p-4 space-y-4 kanban-cards min-h-[150px]">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            appliedJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job}
                className="data-job-id={job.id}"
              />
            ))
          )}
          {!isLoading && appliedJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No applications in this column
            </div>
          )}
        </div>
      </div>
      
      {/* Interview Column */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow kanban-column transition-all duration-300 hover:shadow-md"
        onDragOver={(e) => handleDragOver(e, "interview")}
        onDrop={(e) => handleDrop(e, "interview")}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-display text-lg font-medium text-[#2C3E50] dark:text-gray-200 flex items-center">
            Interview <span className="ml-2 bg-[#0A66C2] dark:bg-blue-700 text-white py-1 px-2 rounded-full text-xs">{interviewJobs.length}</span>
          </h3>
        </div>
        <div className="p-4 space-y-4 kanban-cards min-h-[150px]">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            interviewJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job}
                className="data-job-id={job.id}"
              />
            ))
          )}
          {!isLoading && interviewJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No applications in this column
            </div>
          )}
        </div>
      </div>
      
      {/* Offer Column */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow kanban-column transition-all duration-300 hover:shadow-md"
        onDragOver={(e) => handleDragOver(e, "offer")}
        onDrop={(e) => handleDrop(e, "offer")}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-display text-lg font-medium text-[#2C3E50] dark:text-gray-200 flex items-center">
            Offer <span className="ml-2 bg-[#057642] dark:bg-green-700 text-white py-1 px-2 rounded-full text-xs">{offerJobs.length}</span>
          </h3>
        </div>
        <div className="p-4 space-y-4 kanban-cards min-h-[150px]">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
            </>
          ) : (
            offerJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job}
                className="data-job-id={job.id}"
              />
            ))
          )}
          {!isLoading && offerJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No applications in this column
            </div>
          )}
        </div>
      </div>
      
      {/* Rejected Column */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow kanban-column transition-all duration-300 hover:shadow-md"
        onDragOver={(e) => handleDragOver(e, "rejected")}
        onDrop={(e) => handleDrop(e, "rejected")}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-display text-lg font-medium text-[#2C3E50] dark:text-gray-200 flex items-center">
            Rejected <span className="ml-2 bg-gray-500 dark:bg-gray-600 text-white py-1 px-2 rounded-full text-xs">{rejectedJobs.length}</span>
          </h3>
        </div>
        <div className="p-4 space-y-4 kanban-cards min-h-[150px]">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            rejectedJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job}
                className="data-job-id={job.id}"
              />
            ))
          )}
          {!isLoading && rejectedJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No applications in this column
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
