import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Interview } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// Form schema for adding/editing interviews
const interviewFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  completed: z.boolean().default(false),
  feedback: z.string().optional(),
  jobApplicationId: z.number(),
});

type InterviewFormValues = z.infer<typeof interviewFormSchema>;

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview?: Interview;
  jobApplicationId?: number;
}

function InterviewModal({ isOpen, onClose, interview, jobApplicationId }: InterviewModalProps) {
  const { toast } = useToast();
  const isEditMode = !!interview;
  
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      title: interview?.title || "",
      date: interview?.date ? format(new Date(interview.date), "yyyy-MM-dd'T'HH:mm") : "",
      notes: interview?.notes || "",
      completed: interview?.completed || false,
      feedback: interview?.feedback || "",
      jobApplicationId: interview?.jobApplicationId || jobApplicationId || 0,
    },
  });
  
  const { data: applications } = useQuery({
    queryKey: ["/api/applications"],
    enabled: isOpen,
  });
  
  const interviewMutation = useMutation({
    mutationFn: async (data: InterviewFormValues) => {
      if (isEditMode) {
        await apiRequest("PATCH", `/api/interviews/${interview.id}`, data);
      } else {
        await apiRequest("POST", "/api/interviews", data);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Interview updated" : "Interview added",
        description: isEditMode 
          ? "Your interview has been successfully updated." 
          : "Your interview has been successfully scheduled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: isEditMode ? "Failed to update interview" : "Failed to add interview",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: InterviewFormValues) {
    interviewMutation.mutate(data);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Interview" : "Schedule Interview"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Technical Interview" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date and Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobApplicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Application</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    >
                      <option value="">Select a job application</option>
                      {applications?.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.position} at {app.company}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes for interview preparation"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isEditMode && (
              <>
                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as completed</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any feedback received after the interview"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={interviewMutation.isPending}>
                {interviewMutation.isPending 
                  ? (isEditMode ? "Updating..." : "Scheduling...") 
                  : (isEditMode ? "Update" : "Schedule")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | undefined>(undefined);
  
  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
  });
  
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/interviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      toast({
        title: "Interview deleted",
        description: "The interview has been removed from your calendar.",
      });
    }
  });
  
  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-[#2C3E50]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  const renderDays = () => {
    const days = [];
    const dateFormat = "EEE";
    
    const startDate = startOfWeek(currentMonth);
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-600">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    
    return <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg">{days}</div>;
  };
  
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        // Filter interviews for this day
        const dayInterviews = interviews?.filter(interview => 
          isSameDay(new Date(interview.date), cloneDay)
        ) || [];
        
        days.push(
          <div 
            key={day.toString()} 
            className={`bg-white h-24 p-1 text-sm ${
              !isSameMonth(day, monthStart) ? "text-gray-400" : 
              isSameDay(day, selectedDate) ? "border-2 border-[#0A66C2]" : ""
            }`}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="text-right">{format(day, "d")}</div>
            <div className="mt-1 space-y-1">
              {dayInterviews.map(interview => (
                <div 
                  key={interview.id} 
                  className="p-1 text-xs bg-[#0A66C2]/10 text-[#0A66C2] rounded cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInterview(interview);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="font-medium truncate">{format(new Date(interview.date), "h:mm a")}</div>
                  <div className="truncate">{interview.title}</div>
                </div>
              ))}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-px bg-gray-200">
          {days}
        </div>
      );
      
      days = [];
    }
    
    return <div className="bg-gray-200 rounded-b-lg">{rows}</div>;
  };
  
  // Get interviews for the upcoming days
  const upcomingInterviews = interviews
    ?.filter(interview => new Date(interview.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        {renderHeader()}
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <>
            {renderDays()}
            {renderCells()}
          </>
        )}
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium text-[#2C3E50]">Upcoming Interviews</h4>
              <Button onClick={() => {
                setSelectedInterview(undefined);
                setIsModalOpen(true);
              }}>
                Schedule Interview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : upcomingInterviews && upcomingInterviews.length > 0 ? (
              <div className="space-y-3">
                {upcomingInterviews.map(interview => (
                  <div key={interview.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="w-2 h-10 bg-[#0A66C2] rounded-full mr-4"></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h5 className="font-medium">{interview.title}</h5>
                        <span className="text-sm text-gray-500">
                          {format(new Date(interview.date), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interview.notes || "No additional notes"}
                      </p>
                    </div>
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedInterview(interview);
                          setIsModalOpen(true);
                        }}
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming interviews scheduled.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <InterviewModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInterview(undefined);
        }}
        interview={selectedInterview}
      />
    </div>
  );
}
