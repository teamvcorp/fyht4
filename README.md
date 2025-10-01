# FYHT4 Change

FYHT4 Change is a community-driven platform that empowers citizens to propose, vote on, and fund local projects. Built with Next.js, MongoDB, and Stripe for secure payments and membership management.

## Getting started

First, install the dependencies:

```bash
npm install
```

Set up your environment variables by copying `.env.example` to `.env.local` and filling in your credentials:

- MongoDB connection string
- NextAuth configuration
- Stripe API keys
- Email service credentials

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

- **Project Submission**: Members can propose community projects
- **Voting System**: ZIP code-based democratic voting on projects
- **Membership Management**: Stripe-powered subscription system
- **Donation Processing**: Secure payment handling for project funding
- **Admin Dashboard**: Review and approve project proposals
- **Impact Tracking**: Personal dashboard showing user contributions

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel-ready

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - Reusable React components
- `/src/models` - MongoDB/Mongoose schemas
- `/src/lib` - Utility functions and configurations
- `/src/types` - TypeScript type definitions
