import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { DocumentsList } from "@/components/documents/document-card";
import { UploadDocumentModal } from "@/components/documents/upload-document-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DocumentsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-[#2C3E50] sm:text-3xl sm:truncate font-display">
                Documents
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Upload Document
              </Button>
            </div>
          </div>

          {/* Documents List */}
          <div className="mt-8">
            <DocumentsList />
          </div>
        </div>
      </main>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
