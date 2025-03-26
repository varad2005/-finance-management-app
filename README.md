# Job Application Tracking System

A comprehensive job application tracking system that empowers users to manage their career journey with advanced Kanban-style workflow, intelligent document management, and data-driven analytics.

## Features

- **User Authentication**: Secure login and registration system
- **Job Application Tracking**: Kanban-style board to track job applications
- **Document Management**: Store and organize resumes and cover letters
- **Interview Management**: Schedule and track interviews
- **Analytics Dashboard**: Visualize your job search progress

## Deploying to Netlify

This application is configured for easy deployment to Netlify. Follow these steps:

1. Create a free account on [Netlify](https://www.netlify.com/)

2. Connect your GitHub, GitLab, or Bitbucket account to Netlify
   - First, push this codebase to your preferred Git provider
   - In Netlify, click "New site from Git" and select your repository

3. Configure the build settings:
   - Build command: `bash netlify-build.sh`
   - Publish directory: `client/dist`

4. Add the following environment variables in Netlify:
   - `SESSION_SECRET`: A random string for session encryption
   - `DATABASE_URL`: Your PostgreSQL database connection string

5. Deploy your site!

### Database Setup on Netlify

For the database, you have several options:

1. **Use Neon Database** (Recommended for free tier):
   - Create a free PostgreSQL database at [Neon](https://neon.tech/)
   - Add the connection string to your Netlify environment variables

2. **Use Supabase**:
   - Create a free PostgreSQL database at [Supabase](https://supabase.com/)
   - Add the connection string to your Netlify environment variables

3. **Use Railway.app**:
   - Create a PostgreSQL instance on [Railway](https://railway.app/)
   - Connect it to your Netlify deployment

## Local Development

To run this project locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Access the application at http://localhost:5000