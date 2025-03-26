import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { z } from "zod";
import { loginSchema, insertUserSchema, insertAccountSchema, insertCategorySchema, insertTransactionSchema, insertBudgetSchema } from "@shared/schema";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import session from "express-session";
import memorystore from "memorystore";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session middleware with in-memory storage
  const MemoryStore = memorystore(session);
  
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "finance-manager-secret",
    })
  );
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };
  
  // Seed initial data for demo purposes
  await seedInitialData();
  
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create user
      const user = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user || user.password !== validatedData.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Accounts Routes
  app.get("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const accounts = await storage.getAccountsByUserId(userId!);
      res.status(200).json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get accounts" });
    }
  });
  
  app.post("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const account = {
        ...req.body,
        userId,
      };
      
      const validatedData = insertAccountSchema.parse(account);
      const createdAccount = await storage.createAccount(validatedData);
      
      res.status(201).json(createdAccount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  
  // Categories Routes
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const categories = await storage.getCategoriesByUserId(userId!);
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });
  
  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const category = {
        ...req.body,
        userId,
      };
      
      const validatedData = insertCategorySchema.parse(category);
      const createdCategory = await storage.createCategory(validatedData);
      
      res.status(201).json(createdCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // Transactions Routes
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { categoryId, timeFrame } = req.query;
      
      let startDate: Date;
      const endDate = new Date();
      
      // Apply time filter
      switch (timeFrame) {
        case "7days":
          startDate = subDays(endDate, 7);
          break;
        case "30days":
          startDate = subDays(endDate, 30);
          break;
        case "90days":
          startDate = subDays(endDate, 90);
          break;
        case "year":
          startDate = new Date(endDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = subDays(endDate, 7);
      }
      
      // Get transactions with filters
      let transactions = await storage.getTransactionsByDateRange(
        userId!,
        startDate,
        endDate
      );
      
      // Apply category filter if provided
      if (categoryId && categoryId !== "all") {
        transactions = transactions.filter(
          (t) => t.categoryId === Number(categoryId)
        );
      }
      
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });
  
  app.get("/api/transactions/recent", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const transactions = await storage.getRecentTransactions(userId!, 5);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent transactions" });
    }
  });
  
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const transaction = {
        ...req.body,
        userId,
      };
      
      const validatedData = insertTransactionSchema.parse(transaction);
      const createdTransaction = await storage.createTransaction(validatedData);
      
      // Update account balance
      const { accountId, amount, type } = validatedData;
      const account = await storage.getAccount(accountId);
      
      if (account) {
        const newBalance = type === "income"
          ? Number(account.balance) + Number(amount)
          : Number(account.balance) - Number(amount);
          
        await storage.updateAccountBalance(accountId, newBalance);
      }
      
      res.status(201).json(createdTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  // Budgets Routes
  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const budgets = await storage.getBudgetsByUserId(userId!);
      res.status(200).json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get budgets" });
    }
  });
  
  app.post("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const budget = {
        ...req.body,
        userId,
      };
      
      const validatedData = insertBudgetSchema.parse(budget);
      const createdBudget = await storage.createBudget(validatedData);
      
      res.status(201).json(createdBudget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });
  
  app.get("/api/budgets/progress/:yearMonth?", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const yearMonth = req.params.yearMonth || format(new Date(), "yyyy-MM");
      
      const [year, month] = yearMonth.split("-").map(Number);
      
      // Get start and end dates for the month
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));
      
      // Get transactions for the month
      const transactions = await storage.getTransactionsByDateRange(
        userId!,
        monthStart,
        monthEnd
      );
      
      // Get budgets
      const budgets = await storage.getBudgetsByUserId(userId!);
      
      // Calculate spent amount per category
      const expenseTransactions = transactions.filter(t => t.type === "expense");
      const categorySpent: Record<number, number> = {};
      
      expenseTransactions.forEach(transaction => {
        if (!transaction.categoryId) return;
        
        if (!categorySpent[transaction.categoryId]) {
          categorySpent[transaction.categoryId] = 0;
        }
        
        categorySpent[transaction.categoryId] += Number(transaction.amount);
      });
      
      // Map spent amounts to budget IDs
      const result: Record<number, number> = {};
      
      budgets.forEach(budget => {
        result[budget.id] = categorySpent[budget.categoryId] || 0;
      });
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to get budget progress" });
    }
  });
  
  // Summary Route
  app.get("/api/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Get current month transactions
      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());
      
      const currentMonthTransactions = await storage.getTransactionsByDateRange(
        userId!,
        currentMonthStart,
        currentMonthEnd
      );
      
      // Get previous month transactions
      const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
      const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));
      
      const prevMonthTransactions = await storage.getTransactionsByDateRange(
        userId!,
        prevMonthStart,
        prevMonthEnd
      );
      
      // Calculate monthly income, expenses, and savings
      const currentIncome = currentMonthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const currentExpenses = currentMonthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const currentSavings = currentIncome - currentExpenses;
      
      const prevIncome = prevMonthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const prevExpenses = prevMonthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const prevSavings = prevIncome - prevExpenses;
      
      // Calculate percent changes
      const incomeChange = prevIncome === 0 ? 0 : ((currentIncome - prevIncome) / prevIncome) * 100;
      const expensesChange = prevExpenses === 0 ? 0 : ((currentExpenses - prevExpenses) / prevExpenses) * 100;
      const savingsChange = prevSavings === 0 ? 0 : ((currentSavings - prevSavings) / prevSavings) * 100;
      
      // Get accounts and calculate total balance
      const accounts = await storage.getAccountsByUserId(userId!);
      const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
      
      // For simplicity, we'll use a fixed balance change percentage
      const balanceChange = 2.5;
      
      // Get dummy monthly data for the spending chart
      const monthlyData = [
        { month: 'Jan', income: 4200, expenses: 3100 },
        { month: 'Feb', income: 4300, expenses: 3300 },
        { month: 'Mar', income: 4900, expenses: 3500 },
        { month: 'Apr', income: 4800, expenses: 3300 },
        { month: 'May', income: 5100, expenses: 3600 },
        { month: 'Jun', income: 4900, expenses: 3400 },
        { month: 'Jul', income: 5240, expenses: 3590 },
      ];
      
      const summary = {
        totalBalance,
        balanceChange,
        monthlyIncome: currentIncome,
        incomeChange,
        monthlyExpenses: currentExpenses,
        expensesChange,
        monthlySavings: currentSavings,
        savingsChange,
        monthlyData,
      };
      
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to get summary" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

async function seedInitialData() {
  try {
    // Check if we already have a user
    const existingUser = await storage.getUserByUsername("demo");
    if (existingUser) {
      return; // Data already seeded
    }
    
    // Create demo user
    const user = await storage.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      name: "Demo User",
    });
    
    // Create accounts
    const checkingAccount = await storage.createAccount({
      userId: user.id,
      name: "Checking Account",
      type: "checking",
      balance: 5000,
      isConnected: false,
    });
    
    const savingsAccount = await storage.createAccount({
      userId: user.id,
      name: "Savings Account",
      type: "savings",
      balance: 3254,
      isConnected: false,
    });
    
    // Create categories
    const housingCategory = await storage.createCategory({
      userId: user.id,
      name: "Housing",
      type: "expense",
      color: "#2ECC71",
      icon: "home",
    });
    
    const foodCategory = await storage.createCategory({
      userId: user.id,
      name: "Food & Dining",
      type: "expense",
      color: "#3498DB",
      icon: "shopping-cart",
    });
    
    const transportationCategory = await storage.createCategory({
      userId: user.id,
      name: "Transportation",
      type: "expense",
      color: "#E74C3C",
      icon: "car",
    });
    
    const entertainmentCategory = await storage.createCategory({
      userId: user.id,
      name: "Entertainment",
      type: "expense",
      color: "#9B59B6",
      icon: "film",
    });
    
    const incomeCategory = await storage.createCategory({
      userId: user.id,
      name: "Income",
      type: "income",
      color: "#2ECC71",
      icon: "dollar-sign",
    });
    
    // Create budgets
    await storage.createBudget({
      userId: user.id,
      categoryId: housingCategory.id,
      amount: 1500,
      period: "monthly",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
    
    await storage.createBudget({
      userId: user.id,
      categoryId: foodCategory.id,
      amount: 800,
      period: "monthly",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
    
    await storage.createBudget({
      userId: user.id,
      categoryId: transportationCategory.id,
      amount: 300,
      period: "monthly",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
    
    await storage.createBudget({
      userId: user.id,
      categoryId: entertainmentCategory.id,
      amount: 300,
      period: "monthly",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
    
    // Create transactions
    const currentDate = new Date();
    
    // Income transaction (paycheck)
    await storage.createTransaction({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: incomeCategory.id,
      amount: 2620,
      description: "Paycheck",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      type: "income",
      paymentMethod: "Direct Deposit",
    });
    
    // Expense transactions
    await storage.createTransaction({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: housingCategory.id,
      amount: 1450,
      description: "Rent Payment",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
      type: "expense",
      paymentMethod: "Bank Transfer",
    });
    
    await storage.createTransaction({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: foodCategory.id,
      amount: 84.32,
      description: "Whole Foods Market",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 24),
      type: "expense",
      paymentMethod: "Debit Card",
    });
    
    await storage.createTransaction({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: transportationCategory.id,
      amount: 45.67,
      description: "Shell Gas Station",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 12),
      type: "expense",
      paymentMethod: "Credit Card",
    });
    
    await storage.createTransaction({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: entertainmentCategory.id,
      amount: 14.99,
      description: "Netflix Subscription",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
      type: "expense",
      paymentMethod: "Credit Card",
    });
    
    // Update account balances
    await storage.updateAccountBalance(
      checkingAccount.id,
      2620 - 1450 - 84.32 - 45.67 - 14.99
    );
    
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}
