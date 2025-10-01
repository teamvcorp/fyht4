# FYHT4 (Fight 4 Change) - App Reference Guide

## 🎯 **App Purpose & Mission**
FYHT4 is a **community-driven democratic platform** that empowers local communities to identify, vote on, and fund projects that address real needs. The mission is simple: **"A World Where Effort Unlocks Opportunity"** - creating pathways to fair access to housing, food, healthcare, and education without bureaucracy.

## 🏗️ **Core Workflow (User Journey)**

### 1. **Discovery Phase** 
- **Members submit project proposals** in 3 focus areas: Education, Health & Well-being, Housing
- **Admin review** - Proposals go to admin for approval/rejection with notes
- **Email notifications** sent via Resend for approval/rejection

### 2. **Voting Phase**
- **ZIP-code based democracy** - Only residents of the project's ZIP code can vote
- **Vote thresholds** - Projects need minimum "yes" votes to advance
- **Status: "voting"** - Community decides what gets built

### 3. **Funding Phase** 
- **Donation system** via Stripe (one-time & monthly)
- **Project-specific donations** - Users can donate to individual projects
- **Funding goals** - Each project has a dollar target
- **Status: "funding"** - Once vote goals met, funding begins

### 4. **Build Phase**
- **Implementation** - Funded projects get built with transparency
- **Progress tracking** - Updates and accountability
- **Status: "build" → "completed"**

## 👥 **User Types & Permissions**

### **Public Users (No Account)**
- Browse projects
- View project details
- Cannot vote, donate, or submit proposals

### **Members (Monthly Subscribers)**
- **Sign up** via Google OAuth or Email (NextAuth)
- **Submit proposals** (requires active monthly subscription)
- **Vote on projects** (ZIP-code restricted)
- **Donate** to projects (one-time or monthly)
- **Watch projects** (like bookmarking)
- **Dashboard** showing donated/watching projects

### **Admins**
- **Review proposals** (/admin/proposals)
- **Manage projects** (/admin/projects)
- **Transition project status** (voting → funding → build → completed)

## 🛠️ **Technical Stack**

### **Frontend**
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + custom design system
- **Framer Motion** for animations
- **MDX** for case studies/blog posts

### **Backend & Services**
- **NextAuth** for authentication (Google OAuth + Email)
- **MongoDB** with Mongoose ODM
- **Stripe** for payments & subscriptions
- **Resend** for email notifications
- **Vercel Blob** for file uploads

### **Key Models**
```typescript
// Project lifecycle
ProjectProposal (pending/approved/rejected) 
  → Project (voting/funding/build/completed)

// User engagement  
User (members with zipcode)
Donation (tracks who donated to what)
Watchlist (bookmarked projects)
ProjectVote (one vote per user per project)
```

## 📍 **Key Features**

### **Democracy Features**
- **ZIP-code voting** - Geographic democracy
- **Proposal system** - Members drive the agenda
- **Vote thresholds** - Community consensus required
- **Transparent process** - All voting/funding visible

### **Funding Features**
- **Stripe integration** - Secure payments
- **Monthly subscriptions** - Recurring membership
- **Project donations** - Direct project funding
- **Custom amounts** - Flexible giving

### **Admin Features**
- **Proposal review** - Approve/reject with notes
- **Project management** - Status transitions
- **Email notifications** - Automated updates
- **Analytics dashboard** - Track progress

## 🎨 **Design System**
- **Professional nonprofit aesthetic** 
- **Accessible color scheme** (neutral grays, emerald accents)
- **Consistent typography** (display font for headers)
- **Card-based layouts** for projects
- **Mobile-first responsive design**

## 🔐 **Security & Permissions**
- **Authenticated routes** - Member/admin protection
- **ZIP-code validation** - Geographic voting restrictions  
- **Subscription checks** - Monthly member benefits
- **Admin guards** - Protected admin functions

## 📱 **Core Pages Structure**

### **Public**
- `/` - Homepage with mission & CTA
- `/donate` - Donation tiers & membership
- `/projects` - Browse all projects (search/filter)
- `/projects/[id]` - Individual project details
- `/membership` - Sign up/sign in
- `/about` - Mission & team
- `/work` - Case studies (MDX)
- `/process` - How it works

### **Member**
- `/dashboard` - Personal profile & donated/watching projects
- `/projects/submit` - Submit proposal form
- `/settings/connections` - Account management

### **Admin**
- `/admin/proposals` - Review pending proposals
- `/admin/projects` - Manage project lifecycle

## 🎯 **Success Metrics**
- **Proposal → Project conversion rate**
- **Voting participation** by ZIP code
- **Funding goal achievement** 
- **Project completion** & community impact

---

## 🚀 **Current State & Next Steps**

The app has a solid foundation with the complete democratic workflow implemented. The core functionality works: proposal submission → admin review → community voting → project funding → implementation tracking.

**Areas for Enhancement:**
1. **User Experience** - Better loading states, error handling, form validation
2. **Performance** - Image optimization, caching, search functionality  
3. **Engagement** - Better project discovery, social features, impact reporting
4. **Analytics** - User behavior tracking, project success metrics
5. **Mobile Experience** - PWA features, offline capability

This is a powerful platform for **grassroots democracy and community organizing** with a clear path from idea to implementation.