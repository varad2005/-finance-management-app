import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Download, MoreVertical, Trash2, FileEdit, File, Presentation } from "lucide-react";
import { UploadDocumentModal } from "./upload-document-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Document } from "@shared/schema";

interface DocumentProps {
  document: Document;
}

function DocumentCard({ document }: DocumentProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  const deleteDocumentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/documents/${document.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "Your document has been successfully deleted.",
      });
      setIsDetailsModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete document",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getIcon = () => {
    switch (document.type) {
      case "resume":
      case "cover_letter":
        return <File className="h-6 w-6 text-gray-400" />;
      case "presentation":
        return <Presentation className="h-6 w-6 text-gray-400" />;
      default:
        return <FileText className="h-6 w-6 text-gray-400" />;
    }
  };

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}w ago`;
    } else {
      return `${Math.floor(diffDays / 30)}m ago`;
    }
  };

  return (
    <>
      <Card className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl text-gray-400 dark:text-gray-300">
            {getIcon()}
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Download className="h-4 w-4 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setIsDetailsModalOpen(true)}
            >
              <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100" />
            </Button>
          </div>
        </div>
        <h5 className="font-medium text-[#2C3E50] dark:text-gray-200">{document.name}</h5>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{document.description}</p>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Updated {formatDate(document.updatedAt)}</span>
          <span>Used {document.usageCount || 0} times</span>
        </div>
      </Card>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{document.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{document.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="capitalize dark:text-gray-300">{document.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="dark:text-gray-300">{new Date(document.createdAt!).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
                <span className="dark:text-gray-300">{new Date(document.updatedAt!).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Usage count:</span>
                <span className="dark:text-gray-300">{document.usageCount} times</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => deleteDocumentMutation.mutate()}
              disabled={deleteDocumentMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteDocumentMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button onClick={() => setIsEditModalOpen(true)}>
              <FileEdit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isEditModalOpen && (
        <UploadDocumentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          document={document}
        />
      )}
    </>
  );
}

export function DocumentsList() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });
  
  const resumeDocuments = documents?.filter(doc => doc.type === "resume") || [];
  const coverLetterDocuments = documents?.filter(doc => doc.type === "cover_letter") || [];
  const otherDocuments = documents?.filter(doc => !["resume", "cover_letter"].includes(doc.type)) || [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#2C3E50] dark:text-gray-200 font-display">My Documents</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-base font-medium text-[#2C3E50] dark:text-gray-200 mb-4">Resumes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </>
            ) : resumeDocuments.length > 0 ? (
              resumeDocuments.map(document => (
                <DocumentCard key={document.id} document={document} />
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                No resumes found. Upload a resume to get started.
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-base font-medium text-[#2C3E50] dark:text-gray-200 mb-4">Cover Letters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </>
            ) : coverLetterDocuments.length > 0 ? (
              coverLetterDocuments.map(document => (
                <DocumentCard key={document.id} document={document} />
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                No cover letters found. Upload a cover letter to get started.
              </div>
            )}
          </div>
        </div>
        
        {(otherDocuments.length > 0 || isLoading) && (
          <div>
            <h4 className="text-base font-medium text-[#2C3E50] dark:text-gray-200 mb-4">Other Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <Skeleton className="h-40" />
              ) : (
                otherDocuments.map(document => (
                  <DocumentCard key={document.id} document={document} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
