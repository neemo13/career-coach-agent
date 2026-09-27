# Career Coach AI

An AI-powered career intelligence platform that analyzes a candidate's resume against a job description, identifies skill gaps, provides grounded career coaching, and generates a personalized learning plan.

The project is built as a full-stack application using **React, FastAPI, Supabase/PostgreSQL, and Gemini**, with a lightweight agentic workflow for career coaching and learning-plan generation.

---

## What It Does

Career Coach AI helps candidates understand how well their current profile matches a specific job and what they can do to improve.

### Core workflow

```text
Resume + Job Description
          ↓
     AI Analysis
          ↓
   Match Score + Insights
          ↓
     Skill Gaps
          ↓
     Career Coach
          ↓
Discuss Goals & Priorities
          ↓
 Personalized Learning Plan
```

The system separates the **objective analysis** from the **personalized action plan**.

The analysis identifies what the candidate is missing for a particular role. The Career Coach then helps the candidate decide what they actually want to prioritize before generating or updating their learning plan.

---

## Features

### Resume Management

* Upload resumes in PDF format
* Extract resume text through the backend
* Store resume information securely
* View and manage previously uploaded resumes

### Job Description Management

* Enter job descriptions
* Store job descriptions for future analysis
* Associate analyses with specific job descriptions

### AI Career Analysis

The analysis workflow evaluates a resume against a job description and provides:

* Match score
* Matching skills
* Missing skills
* Strengths
* Weaknesses
* Recommendations
* Overall summary

The match score is generated through deterministic skill-matching logic rather than allowing the LLM to arbitrarily assign a score.

### Career Coach

The Career Coach provides conversational guidance grounded in the selected analysis.

It has access to:

* Match score
* Matching skills
* Missing skills
* Strengths
* Weaknesses
* Recommendations
* Learning plan
* Recent conversation history

The coach can discuss career priorities without automatically generating a learning plan whenever a skill gap is mentioned.

### Personalized Learning Plan

The learning plan is designed around the candidate's actual preferences.

For example, an analysis may identify:

```text
Java
System Design
Testing
```

The candidate may tell the Career Coach:

```text
I want to focus on Python first.
Then I want to work on System Design and Testing.
I do not want to prioritize Java right now.
```

The resulting learning plan can reflect those preferences while keeping the original analysis objective.

The learning plan supports:

* Skill
* Priority
* Recommended learning area
* Difficulty
* Learning order
* Short-term / long-term classification
* Learning resources
* Completion tracking
* Personal notes

The application maintains **one global learning plan per user**, allowing the Career Coach to build on and update the same plan across analyses.

### Analysis History

Users can:

* View previous analyses
* Open individual analysis details
* Review previous recommendations
* Start a Career Coach conversation for an analysis
* Delete analyses they own

### Authentication & Data Security

* Email/password authentication through Supabase
* JWT-based authentication between frontend and backend
* Row Level Security (RLS) enabled in Supabase
* Backend ownership validation for user-specific resources
* Users cannot access another user's resumes, analyses, coach conversations, or learning plan

---

## Agentic Workflow

The project uses a lightweight agentic architecture rather than an orchestration framework.

The Career Coach determines whether the user's message is:

1. A normal career question
2. Exploratory discussion about learning priorities
3. A request to create a learning plan
4. A request to update an existing learning plan
5. A confirmation to perform the requested learning-plan action

The learning-plan action is only performed when the user's intent is sufficiently clear.

```text
User Message
     ↓
Career Coach
     ↓
LLM Response + Intent Signal
     ↓
Decision Logic
     ├── Normal response
     ├── Ask for confirmation
     ├── Generate learning plan
     └── Update existing learning plan
```

This keeps the system simple and predictable while still providing an agentic interaction.

---

## Architecture

```text
┌──────────────────────────────┐
│          React UI            │
│                              │
│ Home                         │
│ Resume                       │
│ Job Description              │
│ Analyses                     │
│ Career Coach                 │
│ Learning Plan                │
└──────────────┬───────────────┘
               │
               │ HTTP + JWT
               ▼
┌──────────────────────────────┐
│          FastAPI             │
│                              │
│ Authentication               │
│ Resume API                   │
│ Job Description API          │
│ Analysis API                 │
│ Coach API                    │
│ Learning Plan API            │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│   Supabase   │  │    Gemini    │
│ PostgreSQL   │  │     LLM      │
│              │  │              │
│ Profiles     │  │ Analysis     │
│ Resumes      │  │ Coach        │
│ Job Descs    │  │ Learning Plan│
│ Analyses     │  │              │
│ Career Plans │  └──────────────┘
│ Coach Msgs   │
└──────────────┘
```

---

## Technology Stack

### Frontend

* React 18
* React Router
* Vite
* JavaScript
* Supabase JavaScript client
* Custom CSS

### Backend

* Python 3.11
* FastAPI
* Pydantic
* Uvicorn
* Supabase Python client
* PyJWT
* pypdf
* python-multipart

### AI

* Google Gemini
* Structured JSON generation
* Pydantic validation
* Retry handling for invalid structured responses
* Hand-written agentic decision logic

### Database & Authentication

* Supabase
* PostgreSQL
* Row Level Security (RLS)
* Supabase Authentication

---

## Project Structure

```text
career-coach/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── career_agent.py
│   │   │
│   │   ├── api/
│   │   │   ├── analysis.py
│   │   │   ├── coach.py
│   │   │   ├── jobs.py
│   │   │   ├── learning_plan.py
│   │   │   └── resumes.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── llm_provider.py
│   │   │   ├── security.py
│   │   │   └── supabase_client.py
│   │   │
│   │   ├── schemas/
│   │   ├── services/
│   │   └── tools/
│   │       ├── learning_plan_tool.py
│   │       └── skill_matching_tool.py
│   │
│   ├── supabase/
│   │   └── phase2_schema.sql
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── api/
│   │   └── styles/
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

Install:

* Python 3.11
* Node.js
* npm
* A Supabase project
* A Google Gemini API key

---

## 1. Clone the Repository

```bash
git clone https://github.com/neemo13/career-coach-agent.git
cd career-coach
```

---

## 2. Configure Supabase

Create a Supabase project and obtain:

* Project URL
* Publishable key
* Secret key
* Legacy JWT secret

Run the database schema located at:

```text
backend/supabase/phase2_schema.sql
```

The schema creates the application's main tables:

```text
profiles
resumes
job_descriptions
analyses
career_plans
coach_messages
```

Row Level Security is enabled for user-specific data.

---

## 3. Backend Setup

Open a terminal:

```bash
cd backend
python -m venv career-agent
```

Activate the environment.

### Windows PowerShell

```powershell
.\career-agent\Scripts\Activate.ps1
```

### macOS / Linux

```bash
source career-agent/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables in `.env`:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
GEMINI_API_KEY=
LLM_PROVIDER=gemini
FRONTEND_ORIGIN=http://localhost:5173
```

**Never commit `.env` or any secret API keys to GitHub.**

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

---

## 4. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## Security Notes

Environment files containing secrets are intentionally excluded from Git.

The repository only contains:

```text
.env.example
```

and never the real `.env` files.

The backend uses the Supabase secret key for server-side database operations, while the frontend uses the publishable key for authentication.

User ownership is also explicitly checked in backend queries so that authenticated users cannot request another user's resources simply by supplying a different ID.

---

## Design Principles

The project intentionally avoids unnecessary architectural complexity.

### No LangChain

The application uses direct Gemini API integration through a small provider abstraction.

### No LangGraph

The agentic workflow is implemented through explicit application decision logic.

### No RAG

The Career Coach is grounded using the selected analysis, learning plan, and recent conversation history. A vector database is not required for the V1 use case.

### No Multi-Agent System

A single Career Coach workflow is sufficient for the current product scope.

This keeps the system easier to understand, test, debug, and explain during technical interviews.

---

## Current V1 Scope

The current application includes:

* Authentication
* Resume upload and management
* Job description management
* Resume/JD analysis
* Deterministic skill matching
* Match scoring
* Analysis history
* Analysis detail views
* Career Coach
* Persistent coach conversation history
* Agentic learning-plan decision logic
* Global personalized learning plan
* Learning-plan completion tracking
* Learning-plan notes
* Supabase persistence
* User ownership protection

---

## Future Improvements

Potential future improvements include:

* Production deployment
* Improved UI and visual design
* More sophisticated career recommendations
* Additional learning-resource integrations
* Better progress analytics
* Interview preparation workflows
* Job application tracking
* Support for additional document formats

These are intentionally outside the current V1 architecture.

---

## Project Goal

Career Coach AI is designed around a simple idea:

> **Don't just tell candidates whether they match a job. Help them understand what to do next.**

The system combines structured career analysis with conversational guidance so that candidates can move from:

```text
Analyze
   ↓
Understand your gaps
   ↓
Discuss your priorities
   ↓
Create a personalized plan
   ↓
Track your progress
```

---

## Author

**Anne**

GitHub: https://github.com/neemo13
