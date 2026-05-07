

# COMPSCI 320 – Group 2 Project
 
**Repository:** https://github.com/ahaan0502/COMPSCI-320
 
A full-stack web application for COMPSCI 320 at the University of Massachusetts Amherst, made by Team 2. Built with a Next.js frontend and a Node.js backend.
 
---
 
## Prerequisites
 
You'll need:
 
- [Node.js](https://nodejs.org/) (v18 or later)
- npm (ships with Node.js)
- Git
---
 
## Installation
 
### 1. Clone the repository
 
```bash
git clone https://github.com/ahaan0502/COMPSCI-320.git
cd COMPSCI-320
```
 
### 2. Set up environment variables
 
The project requires environment variables for both the frontend and backend.
 
**Frontend:**
```bash
cp frontend/.env.local.example frontend/.env.local
```
Open `frontend/.env.local` and fill in the required values.
 
**Backend:**
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and fill in the required values.
 
### 3. Install dependencies
 
Install packages for both the frontend and backend:
 
```bash
cd frontend
npm install
 
cd ../backend
npm install
```
 
---
 
## Running the Application
 
You'll need two terminal windows open.
 
**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```
 
**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```
 
Once both are running, open your browser and go to [http://localhost:3000](http://localhost:3000).
 
---
 
## Testing
 
Run the test suites:
 
```bash
cd backend
npm test
```
 
```bash
cd frontend
npm test
```
 
---
 
## Project Structure
 
```
COMPSCI-320/
├── frontend/       # Next.js frontend application
├── backend/        # Node.js backend server
└── scripts/        # Utility and setup scripts
```
 
---
