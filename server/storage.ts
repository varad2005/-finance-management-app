import { 
  User, InsertUser, 
  JobApplication, InsertJobApplication,
  Document, InsertDocument,
  Interview, InsertInterview
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import connectPg from "connect-pg-simple";

neonConfig.webSocketConstructor = ws;

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Create a PostgreSQL client to connect to the Neon database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Job Application methods
  getJobApplicationsByUserId(userId: number): Promise<JobApplication[]>;
  getJobApplicationById(id: number): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, update: Partial<JobApplication>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<void>;
  
  // Document methods
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, update: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Interview methods
  getInterviewsByUserId(userId: number): Promise<Interview[]>;
  getInterviewById(id: number): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: number, update: Partial<Interview>): Promise<Interview>;
  deleteInterview(id: number): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobApplications: Map<number, JobApplication>;
  private documents: Map<number, Document>;
  private interviews: Map<number, Interview>;
  public sessionStore: any;
  
  private userId: number;
  private jobApplicationId: number;
  private documentId: number;
  private interviewId: number;
  
  constructor() {
    this.users = new Map();
    this.jobApplications = new Map();
    this.documents = new Map();
    this.interviews = new Map();
    
    this.userId = 1;
    this.jobApplicationId = 1;
    this.documentId = 1;
    this.interviewId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      fullName: insertUser.fullName || null,
      email: insertUser.email || null,
      skills: insertUser.skills || null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Job Application methods
  async getJobApplicationsByUserId(userId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(application => application.userId === userId);
  }
  
  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }
  
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const id = this.jobApplicationId++;
    const now = new Date();
    const newApplication: JobApplication = {
      ...application,
      id,
      url: application.url || null,
      location: application.location || null,
      salary: application.salary || null,
      jobType: application.jobType || null,
      workMode: application.workMode || null,
      description: application.description || null,
      notes: application.notes || null,
      contactInfo: application.contactInfo || null,
      appliedDate: application.appliedDate || now,
      updatedAt: now
    };
    this.jobApplications.set(id, newApplication);
    return newApplication;
  }
  
  async updateJobApplication(id: number, update: Partial<JobApplication>): Promise<JobApplication> {
    const application = this.jobApplications.get(id);
    if (!application) {
      throw new Error("Job application not found");
    }
    
    const updatedApplication: JobApplication = {
      ...application,
      ...update,
      updatedAt: new Date()
    };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  async deleteJobApplication(id: number): Promise<void> {
    this.jobApplications.delete(id);
  }
  
  // Document methods
  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(document => document.userId === userId);
  }
  
  async getDocumentById(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const now = new Date();
    const newDocument: Document = {
      ...document,
      id,
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }
  
  async updateDocument(id: number, update: Partial<Document>): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error("Document not found");
    }
    
    const updatedDocument: Document = {
      ...document,
      ...update,
      updatedAt: new Date()
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }
  
  // Interview methods
  async getInterviewsByUserId(userId: number): Promise<Interview[]> {
    return Array.from(this.interviews.values())
      .filter(interview => interview.userId === userId);
  }
  
  async getInterviewById(id: number): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }
  
  async createInterview(interview: InsertInterview): Promise<Interview> {
    const id = this.interviewId++;
    const newInterview: Interview = {
      ...interview,
      id
    };
    this.interviews.set(id, newInterview);
    return newInterview;
  }
  
  async updateInterview(id: number, update: Partial<Interview>): Promise<Interview> {
    const interview = this.interviews.get(id);
    if (!interview) {
      throw new Error("Interview not found");
    }
    
    const updatedInterview: Interview = {
      ...interview,
      ...update
    };
    this.interviews.set(id, updatedInterview);
    return updatedInterview;
  }
  
  async deleteInterview(id: number): Promise<void> {
    this.interviews.delete(id);
  }
}

export class PostgresStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });

    // Initialize tables
    this.initTables().catch(err => {
      console.error("Error initializing database tables:", err);
    });
  }

  private async initTables() {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        skills TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        location VARCHAR(100),
        salary VARCHAR(50),
        job_type VARCHAR(50),
        work_mode VARCHAR(50),
        description TEXT,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'applied',
        resume_id INTEGER,
        cover_id INTEGER,
        url VARCHAR(255),
        contact_info TEXT,
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_application_id INTEGER REFERENCES job_applications(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        date TIMESTAMP NOT NULL,
        notes TEXT,
        completed BOOLEAN DEFAULT FALSE,
        feedback TEXT
      );
    `);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.full_name,
      email: user.email,
      skills: user.skills,
      createdAt: user.created_at
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return undefined;
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.full_name,
      email: user.email,
      skills: user.skills,
      createdAt: user.created_at
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (username, password, full_name, email, skills) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.username, user.password, user.fullName, user.email, user.skills]
    );
    
    const newUser = result.rows[0];
    return {
      id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      fullName: newUser.full_name,
      email: newUser.email,
      skills: newUser.skills,
      createdAt: newUser.created_at
    };
  }

  // Job Application methods
  async getJobApplicationsByUserId(userId: number): Promise<JobApplication[]> {
    const result = await pool.query('SELECT * FROM job_applications WHERE user_id = $1', [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      company: row.company,
      position: row.position,
      location: row.location,
      salary: row.salary,
      jobType: row.job_type,
      workMode: row.work_mode,
      description: row.description,
      notes: row.notes,
      status: row.status,
      resumeId: row.resume_id,
      coverId: row.cover_id,
      url: row.url,
      contactInfo: row.contact_info,
      appliedDate: row.applied_date,
      updatedAt: row.updated_at
    }));
  }

  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    const result = await pool.query('SELECT * FROM job_applications WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      company: row.company,
      position: row.position,
      location: row.location,
      salary: row.salary,
      jobType: row.job_type,
      workMode: row.work_mode,
      description: row.description,
      url: row.url,
      status: row.status,
      resumeId: row.resume_id,
      coverId: row.cover_id,
      contactInfo: row.contact_info,
      appliedDate: row.applied_date,
      updatedAt: row.updated_at
    };
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const now = new Date();
    const result = await pool.query(
      `INSERT INTO job_applications 
        (user_id, company, position, location, salary, job_type, work_mode, 
         description, url, status, resume_id, cover_id, contact_info, applied_date, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING *`,
      [
        application.userId, 
        application.company, 
        application.position, 
        application.location, 
        application.salary, 
        application.jobType, 
        application.workMode, 
        application.description, 
        application.url, 
        application.status || 'applied', 
        application.resumeId, 
        application.coverId, 
        application.contactInfo, 
        application.appliedDate || now, 
        now
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      company: row.company,
      position: row.position,
      location: row.location,
      salary: row.salary,
      jobType: row.job_type,
      workMode: row.work_mode,
      description: row.description,
      url: row.url,
      status: row.status,
      resumeId: row.resume_id,
      coverId: row.cover_id,
      contactInfo: row.contact_info,
      appliedDate: row.applied_date,
      updatedAt: row.updated_at
    };
  }

  async updateJobApplication(id: number, update: Partial<JobApplication>): Promise<JobApplication> {
    const currentApp = await this.getJobApplicationById(id);
    if (!currentApp) {
      throw new Error("Job application not found");
    }
    
    const setFields = [];
    const values = [];
    let paramCounter = 1;
    
    // Dynamically build the SET clause for the SQL query based on the update object
    if (update.company !== undefined) {
      setFields.push(`company = $${paramCounter++}`);
      values.push(update.company);
    }
    if (update.position !== undefined) {
      setFields.push(`position = $${paramCounter++}`);
      values.push(update.position);
    }
    if (update.location !== undefined) {
      setFields.push(`location = $${paramCounter++}`);
      values.push(update.location);
    }
    if (update.salary !== undefined) {
      setFields.push(`salary = $${paramCounter++}`);
      values.push(update.salary);
    }
    if (update.jobType !== undefined) {
      setFields.push(`job_type = $${paramCounter++}`);
      values.push(update.jobType);
    }
    if (update.workMode !== undefined) {
      setFields.push(`work_mode = $${paramCounter++}`);
      values.push(update.workMode);
    }
    if (update.description !== undefined) {
      setFields.push(`description = $${paramCounter++}`);
      values.push(update.description);
    }
    if (update.url !== undefined) {
      setFields.push(`url = $${paramCounter++}`);
      values.push(update.url);
    }
    if (update.status !== undefined) {
      setFields.push(`status = $${paramCounter++}`);
      values.push(update.status);
    }
    if (update.resumeId !== undefined) {
      setFields.push(`resume_id = $${paramCounter++}`);
      values.push(update.resumeId);
    }
    if (update.coverId !== undefined) {
      setFields.push(`cover_id = $${paramCounter++}`);
      values.push(update.coverId);
    }
    if (update.contactInfo !== undefined) {
      setFields.push(`contact_info = $${paramCounter++}`);
      values.push(update.contactInfo);
    }
    if (update.appliedDate !== undefined) {
      setFields.push(`applied_date = $${paramCounter++}`);
      values.push(update.appliedDate);
    }
    
    // Always update the updated_at field
    setFields.push(`updated_at = $${paramCounter++}`);
    values.push(new Date());
    
    // Add the id as the last parameter
    values.push(id);
    
    const result = await pool.query(
      `UPDATE job_applications SET ${setFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      company: row.company,
      position: row.position,
      location: row.location,
      salary: row.salary,
      jobType: row.job_type,
      workMode: row.work_mode,
      description: row.description,
      url: row.url,
      status: row.status,
      resumeId: row.resume_id,
      coverId: row.cover_id,
      contactInfo: row.contact_info,
      appliedDate: row.applied_date,
      updatedAt: row.updated_at
    };
  }

  async deleteJobApplication(id: number): Promise<void> {
    await pool.query('DELETE FROM job_applications WHERE id = $1', [id]);
  }

  // Document methods
  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    const result = await pool.query('SELECT * FROM documents WHERE user_id = $1', [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description,
      content: row.content,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description,
      content: row.content,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const now = new Date();
    const result = await pool.query(
      `INSERT INTO documents
        (user_id, name, type, description, content, usage_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        document.userId,
        document.name,
        document.type,
        document.description,
        document.content,
        0, // Initial usage count
        now,
        now
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description,
      content: row.content,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async updateDocument(id: number, update: Partial<Document>): Promise<Document> {
    const currentDoc = await this.getDocumentById(id);
    if (!currentDoc) {
      throw new Error("Document not found");
    }
    
    const setFields = [];
    const values = [];
    let paramCounter = 1;
    
    // Dynamically build the SET clause for the SQL query based on the update object
    if (update.name !== undefined) {
      setFields.push(`name = $${paramCounter++}`);
      values.push(update.name);
    }
    if (update.type !== undefined) {
      setFields.push(`type = $${paramCounter++}`);
      values.push(update.type);
    }
    if (update.description !== undefined) {
      setFields.push(`description = $${paramCounter++}`);
      values.push(update.description);
    }
    if (update.content !== undefined) {
      setFields.push(`content = $${paramCounter++}`);
      values.push(update.content);
    }
    if (update.usageCount !== undefined) {
      setFields.push(`usage_count = $${paramCounter++}`);
      values.push(update.usageCount);
    }
    
    // Always update the updated_at field
    setFields.push(`updated_at = $${paramCounter++}`);
    values.push(new Date());
    
    // Add the id as the last parameter
    values.push(id);
    
    const result = await pool.query(
      `UPDATE documents SET ${setFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description,
      content: row.content,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async deleteDocument(id: number): Promise<void> {
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
  }

  // Interview methods
  async getInterviewsByUserId(userId: number): Promise<Interview[]> {
    const result = await pool.query('SELECT * FROM interviews WHERE user_id = $1', [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      jobApplicationId: row.job_application_id,
      title: row.title,
      date: row.date,
      notes: row.notes,
      completed: row.completed,
      feedback: row.feedback
    }));
  }

  async getInterviewById(id: number): Promise<Interview | undefined> {
    const result = await pool.query('SELECT * FROM interviews WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      jobApplicationId: row.job_application_id,
      title: row.title,
      date: row.date,
      notes: row.notes,
      completed: row.completed,
      feedback: row.feedback
    };
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const result = await pool.query(
      `INSERT INTO interviews
        (user_id, job_application_id, title, date, notes, completed, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        interview.userId,
        interview.jobApplicationId,
        interview.title,
        interview.date,
        interview.notes,
        interview.completed || false,
        interview.feedback
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      jobApplicationId: row.job_application_id,
      title: row.title,
      date: row.date,
      notes: row.notes,
      completed: row.completed,
      feedback: row.feedback
    };
  }

  async updateInterview(id: number, update: Partial<Interview>): Promise<Interview> {
    const currentInterview = await this.getInterviewById(id);
    if (!currentInterview) {
      throw new Error("Interview not found");
    }
    
    const setFields = [];
    const values = [];
    let paramCounter = 1;
    
    // Dynamically build the SET clause for the SQL query based on the update object
    if (update.title !== undefined) {
      setFields.push(`title = $${paramCounter++}`);
      values.push(update.title);
    }
    if (update.date !== undefined) {
      setFields.push(`date = $${paramCounter++}`);
      values.push(update.date);
    }
    if (update.notes !== undefined) {
      setFields.push(`notes = $${paramCounter++}`);
      values.push(update.notes);
    }
    if (update.completed !== undefined) {
      setFields.push(`completed = $${paramCounter++}`);
      values.push(update.completed);
    }
    if (update.feedback !== undefined) {
      setFields.push(`feedback = $${paramCounter++}`);
      values.push(update.feedback);
    }
    
    // Add the id as the last parameter
    values.push(id);
    
    const result = await pool.query(
      `UPDATE interviews SET ${setFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      jobApplicationId: row.job_application_id,
      title: row.title,
      date: row.date,
      notes: row.notes,
      completed: row.completed,
      feedback: row.feedback
    };
  }

  async deleteInterview(id: number): Promise<void> {
    await pool.query('DELETE FROM interviews WHERE id = $1', [id]);
  }
}

// Use PostgreSQL for storage
export const storage = new PostgresStorage();
