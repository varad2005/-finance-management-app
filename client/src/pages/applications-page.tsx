import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { JobBoard } from "@/components/job/job-board";
import { AddJobModal } from "@/components/job/add-job-modal";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";

export default function ApplicationsPage() {
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-[#2C3E50] sm:text-3xl sm:truncate font-display">
                Applications
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button onClick={() => setIsAddJobModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Job
              </Button>
            </div>
          </div>

          {/* Application Board */}
          <div className="mt-8">
            <JobBoard />
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
