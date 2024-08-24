# NotHotDog Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Setup and Installation](#setup-and-installation)
5. [Development Workflow](#development-workflow)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing Guidelines](#contributing-guidelines)

## Project Overview

NotHotDog is an open-source testing framework designed to test and validate voice and text-based AI agents. It provides a user-friendly interface for creating, managing, and executing tests against AI models.

The project is structured as a monorepo with two main packages:
- `nothotdog`: The frontend application built with React
- `nothotdog-backend`: The backend API server built with Node.js and Express

## Technology Stack

### Frontend (nothotdog)
- React.js
- React Router for navigation
- Supabase for authentication and data storage
- Tailwind CSS for styling
- Axios for API requests

### Backend (nothotdog-backend)
- Node.js
- Express.js
- Supabase for database and authentication
- WebSocket for real-time communication
- Deepgram for voice transcription

## Project Structure

```
NotHotDog/
├── packages/
│   ├── nothotdog/             # Frontend package
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── css/
│   │   │   ├── icons/
│   │   │   ├── App.js
│   │   │   └── index.js
│   │   ├── public/
│   │   └── package.json
│   │
│   └── nothotdog-backend/     # Backend package
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── utils/
│       ├── server.js
│       └── package.json
│
├── public/
├── .gitignore
├── LICENSE
└── README.md
```

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/vedhsaka/NotHotDog.git
   cd NotHotDog
   ```

2. Install dependencies for both packages:
   ```
   cd packages/nothotdog
   npm install
   cd ../nothotdog-backend
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the `nothotdog` directory
   - Create a `.env.local` file in the `nothotdog-backend` directory
   - For the frontend (`nothotdog/.env.local`):
     ```
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_KEY=your_supabase_anon_key
     DEEPGRAM_API_KEY=your_deepgram_api_key
     CLUDE_API_KEYS=your_claude_api_key
     ```

   - For the backend (`nothotdog-backend/.env.local`):
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_anon_key
     DEEPGRAM_API_KEY=your_deepgram_api_key
     CLUDE_API_KEYS=your_claude_api_key
     PORT=8000
     AXIOM_API_TOKEN=your_axiom_api_token
     AXIOM_DATASET=your_axiom_bucket
     CLIENT=http://localhost:3000
     ```

4. Start the development servers:
   - For the frontend:
     ```
     cd packages/nothotdog
     npm start
     ```
   - For the backend:
     ```
     cd packages/nothotdog-backend
     npm run dev
     ```

## Development Workflow

1. Create a new branch for each feature or bug fix.
2. Write clean, well-documented code.

## API Documentation

The backend API provides the following main endpoints:

- `/api/users`: User management
- `/api/projects`: Project management
- `/api/groups`: Test group management
- `/api/inputs`: Test input management

## Deployment

Deployment instructions will vary based on your hosting provider. Generally, you'll need to:

1. Build the frontend:
   ```
   cd packages/nothotdog
   npm run build
   ```

2. Deploy the backend to a Node.js hosting service (e.g., Heroku, DigitalOcean).
3. Set up environment variables on your hosting provider.
4. Configure your database (Supabase) for production use.

## Contributing Guidelines

1. Fork the repository and create your branch from `main`.
2. If you've changed APIs, update the documentation.
3. Test the changes and all APIs.
4. Issue that pull request!
