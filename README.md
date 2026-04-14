# darija-translator-project

## Overview
A RESTful API built with Jakarta EE + Payara Micro that translates text into Darija using Gemini API.

## Components
- REST API (Java, Maven)
- Chrome Extension
- Python Client
- PHP Client
- React Native Client

## Endpoints
- POST /api/translate
- GET /api/translate/health

## How to Run
1. Install Java 17/21
2. Install Maven
3. Run:
   mvn payara-micro:start

## Example
POST /api/translate
{
  "text": "Hello!",
  "sourceLanguage": "English"
}
