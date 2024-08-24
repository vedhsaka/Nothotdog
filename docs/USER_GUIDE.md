# NotHotDog Client Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Using the UI](#using-the-ui)
   - [Creating Projects](#creating-projects)
   - [Managing Test Groups](#managing-test-groups)
   - [Creating and Managing Tests](#creating-and-managing-tests)
   - [Running Tests from the UI](#running-tests-from-the-ui)
4. [Using the API](#using-the-api)
   - [Authentication](#authentication)
   - [Testing Inputs via API](#testing-inputs-via-api)
   - [API Endpoints](#api-endpoints)
5. [Interpreting Results](#interpreting-results)
6. [Best Practices](#best-practices)

## Introduction

NotHotDog is a powerful platform for testing and evaluating AI agents, particularly those handling voice and text inputs. This documentation will guide you through using both the user interface (UI) and the API to create, manage, and run tests for your AI models.

## Getting Started

1. Sign up for an account at [nothotdog.com](https://app.nothotdog.com)
2. Log in to your account
3. You'll be presented with the main dashboard

## Using the UI

### Creating Projects

1. From the dashboard, click on "New Project"
2. Enter a name for your project
3. Click "Create Project"

**Note**: By default, a new project is created when you sign up for the product.

### Managing Test Groups

1. Select a project from the dashboard
2. Click on "New Test Group" in the sidebar
3. Enter a name for your test group
4. Click "Create Group"

### Creating and Managing Tests

1. On the top bar, click on "Voice Evaluation" or "Text Evaluation" based on your use case
2. Click on "+"
3. For Voice Tests:
   - Enter the API endpoint of your voice bot/application
   - Alternatively, you can choose to make a call via a phone number
   - Once the connection is established:
     - Upload an audio file or record directly in the browser
     - Add expected responses or conditions for evaluation
4. For Text Tests:
   - Set up the API connection details (if applicable)
   - Add expected responses or conditions for evaluation
5. Click "Save Test"
6. Enter a description and select the related Test Group

### Running Tests from the UI

1. Select the test or test group you want to run
2. Click on "Evaluate" for a single test or "Evaluate All" for a group
3. View the results in the UI

## Using the API

### Authentication

To use the API, you need to include your API key in the header of each request:

```
Authorization: Bearer YOUR_API_KEY
```

### Testing Inputs via API

You can test inputs programmatically using our API. Here's an example using curl:

```bash
curl -X POST https://api.nothotdog.com/v1/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_type": "text",
    "content": "Hello, AI!",
    "checks": [
      {
        "field": "response",
        "rule": "contains",
        "value": "Hello"
      }
    ]
  }'
```

### API Endpoints

- `POST /v1/test`: Test an input

## Interpreting Results

- **Pass/Fail Status**: Each test will be marked as "Pass" or "Fail"
- **Detailed Results**: You can view detailed results for each check performed
- **Latency**: For applicable tests, you can view the response time

## Best Practices

1. Organize tests into logical groups
2. Use descriptive names for projects, groups, and tests
3. Start with simple tests and gradually increase complexity
4. Regularly review and update your tests as your AI model evolves
