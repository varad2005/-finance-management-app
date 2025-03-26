import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Paperclip, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { JobApplication } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface JobCardProps {
  job: JobApplication;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  const { toast } = useToast();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/applications/${job.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status updated",
        description: "The job application status has been updated.",
      });
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return `${diffDays}d ago`;
    }
  };

  const getStatusStyles = () => {
    switch (job.status) {
      case "offer":
        return "border-[#057642] border-2";
      case "rejected":
        return "opacity-75";
      default:
        return "";
    }
  };

  return (
    <Card 
      className={cn(
        "draggable bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-0 cursor-move transition-all duration-200 hover:shadow-md",
        getStatusStyles(),
        className
      )} 
      draggable="true"
    >
      <CardContent className="p-4">
        <div className="flex justify-between">
          <h4 className="font-medium text-[#2C3E50] dark:text-gray-200">{job.position}</h4>
          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(job.appliedDate)}</div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{job.company}</div>
        
        {job.status === "interview" && (
          <div className="mt-2 p-2 bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 rounded-md">
            <div className="flex items-center text-xs text-[#0A66C2] dark:text-blue-400">
              <Calendar className="mr-1 h-3 w-3" />
              <span>Interview scheduled</span>
            </div>
          </div>
        )}
        
        {job.status === "offer" && (
          <div className="mt-2 p-2 bg-[#057642]/10 dark:bg-[#057642]/20 rounded-md">
            <div className="flex items-center text-xs text-[#057642] dark:text-green-400">
              <CheckCircle className="mr-1 h-3 w-3" />
              <span>Offer: {job.salary || "Salary not specified"}</span>
            </div>
          </div>
        )}
        
        {job.status === "rejected" && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
              <XCircle className="mr-1 h-3 w-3" />
              <span>{job.notes || "Application not accepted"}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center mt-3">
          {job.workMode && (
            <Badge variant="secondary" className="mr-1">
              {job.workMode}
            </Badge>
          )}
          {job.jobType && (
            <Badge variant="secondary">
              {job.jobType}
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogTrigger asChild>
              <Button variant="link" className="text-[#0A66C2] hover:text-[#0A66C2]/80 dark:text-blue-400 dark:hover:text-blue-300 text-sm p-0 transition-all duration-200 hover:translate-x-0.5">
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">{job.position} at {job.company}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="col-span-3 capitalize">{job.status}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="col-span-3">{job.location || "Not specified"}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium">Salary:</span>
                  <span className="col-span-3">{job.salary || "Not specified"}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="col-span-3">{job.jobType || "Not specified"}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium">Work mode:</span>
                  <span className="col-span-3">{job.workMode || "Not specified"}</span>
                </div>
                {job.description && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <span className="text-sm font-medium">Description:</span>
                    <div className="col-span-3">
                      <p className="text-sm">{job.description}</p>
                    </div>
                  </div>
                )}
                {job.notes && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <span className="text-sm font-medium">Notes:</span>
                    <div className="col-span-3">
                      <p className="text-sm">{job.notes}</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="sm:justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="destructive"
                    onClick={() => updateStatusMutation.mutate("rejected")}
                    disabled={updateStatusMutation.isPending}
                    className="transition-all duration-200 hover:bg-red-600"
                  >
                    Mark as Rejected
                  </Button>
                  {job.status !== "offer" && (
                    <Button 
                      onClick={() => updateStatusMutation.mutate("offer")}
                      disabled={updateStatusMutation.isPending}
                      className="transition-all duration-200 hover:bg-[#0A66C2]/90"
                    >
                      Mark as Offer
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
