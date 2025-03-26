import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Document, insertDocumentSchema } from "@shared/schema";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document; // If provided, will be in edit mode
}

const documentFormSchema = insertDocumentSchema.omit({ 
  userId: true,
  usageCount: true,
  updatedAt: true,
  createdAt: true
}).extend({
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  content: z.string().min(1, "Document content is required"),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

export function UploadDocumentModal({ isOpen, onClose, document }: UploadDocumentModalProps) {
  const { toast } = useToast();
  const isEditMode = !!document;
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: document?.name || "",
      type: document?.type || "resume",
      description: document?.description || "",
      content: document?.content || "",
    },
  });
  
  const documentMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      if (isEditMode) {
        await apiRequest("PATCH", `/api/documents/${document.id}`, data);
      } else {
        await apiRequest("POST", "/api/documents", data);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Document updated" : "Document uploaded",
        description: isEditMode 
          ? "Your document has been successfully updated." 
          : "Your document has been successfully uploaded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: isEditMode ? "Failed to update document" : "Failed to upload document",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: DocumentFormValues) {
    documentMutation.mutate(data);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Document" : "Upload Document"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Resume_2023.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="resume">Resume</SelectItem>
                      <SelectItem value="cover_letter">Cover Letter</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="reference">Reference Letter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="General resume for software roles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your document content here"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={documentMutation.isPending}>
                {documentMutation.isPending 
                  ? (isEditMode ? "Updating..." : "Uploading...") 
                  : (isEditMode ? "Update" : "Upload")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
