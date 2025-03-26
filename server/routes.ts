import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertJobApplicationSchema, 
  insertDocumentSchema, 
  insertInterviewSchema 
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handler for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // Job Applications endpoints
  app.get("/api/applications", isAuthenticated, async (req, res) => {
    try {
      const applications = await storage.getJobApplicationsByUserId(req.user!.id);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", isAuthenticated, async (req, res) => {
    try {
      const data = insertJobApplicationSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const newApplication = await storage.createJobApplication(data);
      res.status(201).json(newApplication);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/applications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getJobApplicationById(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      if (application.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedApplication = await storage.updateJobApplication(id, req.body);
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.delete("/api/applications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getJobApplicationById(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      if (application.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteJobApplication(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Documents endpoints
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocumentsByUserId(req.user!.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const data = insertDocumentSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const newDocument = await storage.createDocument(data);
      res.status(201).json(newDocument);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedDocument = await storage.updateDocument(id, req.body);
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Interviews endpoints
  app.get("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      const interviews = await storage.getInterviewsByUserId(req.user!.id);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  app.post("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      const data = insertInterviewSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const newInterview = await storage.createInterview(data);
      res.status(201).json(newInterview);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const interview = await storage.getInterviewById(id);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      if (interview.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedInterview = await storage.updateInterview(id, req.body);
      res.json(updatedInterview);
    } catch (error) {
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  app.delete("/api/interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const interview = await storage.getInterviewById(id);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      if (interview.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteInterview(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });

  // Dashboard stats
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const applications = await storage.getJobApplicationsByUserId(req.user!.id);
      const interviews = await storage.getInterviewsByUserId(req.user!.id);
      
      const totalApplications = applications.length;
      const interviewsScheduled = interviews.length;
      
      const applicationsByStatus = {
        applied: applications.filter(app => app.status === "applied").length,
        interview: applications.filter(app => app.status === "interview").length,
        offer: applications.filter(app => app.status === "offer").length,
        rejected: applications.filter(app => app.status === "rejected").length
      };
      
      // Calculate response rate (% of applications that led to interviews or offers)
      const responseRate = totalApplications > 0 
        ? Math.round(((applicationsByStatus.interview + applicationsByStatus.offer) / totalApplications) * 100) 
        : 0;
      
      // Days in search calculation (from first application date to now)
      let daysInSearch = 0;
      if (applications.length > 0) {
        const dates = applications.map(app => new Date(app.appliedDate!).getTime());
        const earliestDate = new Date(Math.min(...dates));
        const now = new Date();
        const timeDiff = now.getTime() - earliestDate.getTime();
        daysInSearch = Math.floor(timeDiff / (1000 * 3600 * 24));
      }
      
      res.json({
        totalApplications,
        interviewsScheduled,
        responseRate,
        daysInSearch,
        applicationsByStatus
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
