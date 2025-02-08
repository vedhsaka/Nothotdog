# NotHotDog [WIP]
Simulation, Evaluation, and Experimentation Platform for AI Agents


## Description

NotHotDog is an open-source platform designed for comprehensive testing, evaluation, and simulation of AI agents. It provides a robust framework for generating test cases, running conversational scenarios, and analyzing agent performance across multiple dimensions.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Technologies](#technologies-used)
- [Features](#features)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)
<!--- - [Screenshots](#screenshots) 
- [API Documentation](#api-documentation)--->

## Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Steps
1. Clone the repository
```bash
git clone https://github.com/vedhsaka/NotHotDog.git
cd NotHotDog
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
- Create a `.env.local` file
- Add your Anthropic API key:
```
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Run the development server
```bash
npm run dev
```

## Usage

### Testing Scenarios
1. Navigate to `/tools/test-cases`
2. Create test sets with custom scenarios
3. Generate and run test variations
4. Analyze agent performance metrics

### Key Workflows
- Generate diverse test cases
- Evaluate agent responses
- Analyze conversation metrics
- Validate response formats
- Track performance over time

## Technologies Used

### Core Technologies
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Radix UI
- Recharts

### Supported LLMs
- Anthropic
- OpenAI
- Deepseek
- Gemini

### Testing & Validation
- Zod Schema Validation
- Custom Rule Engine
- Metrics Tracking

## Features

- 🧪 Automated Test Case Generation with 50+ Parallel Runs
- 📊 Comprehensive Metrics Dashboard
- 🤖 Personality Based Testing
- 🔍 Detailed Response Validation
- 📈 Performance Analytics
- 🌐 Scenario-based Testing

<!--- ## Screenshots

*(Placeholder for future screenshots)* --->

<!--- ## API Documentation

### Test Generation Endpoint
- **Endpoint:** `/api/tools/generate-tests`
- **Method:** POST
- **Payload:**
  ```json
  {
    "inputExample": "Sample input format",
    "agentDescription": "Optional agent context"
  }
  ```

### Agent Evaluation Endpoint
- **Endpoint:** `/api/tools/evaluate-agent`
- **Method:** POST
- **Payload:**
  ```json
  {
    "agentEndpoint": "https://api.example.com/agent",
    "testCases": [],
    "headers": {}
  }
  ```

## Roadmap
- Add more advanced AI model integrations
- Expand validation rule complexity
- Improve visualization capabilities
- Create plugin architecture for custom metrics --->

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
6. Please ensure to add a screenshot to show the changes made in the Pull Request.

## Contact

**Project Maintainer:** NotHotDog
- GitHub: [@vedhsaka](https://github.com/vedhsaka)
<!--- - Email: your.email@example.com --->

## License

This project is open-source and available under the MIT License.

## Acknowledgments

- [Anthropic](https://www.anthropic.com) for Claude AI
- Open-source community contributors
- Next.js and React ecosystems
