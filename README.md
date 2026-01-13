# Streaming Chat AI Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

Backend service for a real-time streaming chat application powered by **NestJS**, **Socket.io**, and **Google Gemini AI**.

This project demonstrates a production-ready approach to handling WebSocket connections and streaming AI responses with TypeScript.

## 🚀 Features

- **Real-time Communication**: Full-duplex communication using WebSockets (Socket.io).
- **AI Streaming**: Integration with Google Gemini Flash for low-latency token streaming.
- **Robust Validation**: Zod schemas for runtime payload validation.
- **Concurrency Control**: Manages multiple sessions and user aborts gracefully.
- **Type Safety**: Strictly typed events and DTOs using TypeScript.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **WebSockets**: `@nestjs/websockets`, `socket.io`
- **AI Model**: Google Generative AI (Gemini 1.5 Flash)
- **Validation**: `zod`

## 🏗 Architecture & Design Decisions

- **Custom AI Provider**: Instead of hardcoding the `GoogleGenAI` client, it is provided via a factory in a dedicated `AiModule`. This enhances testability by allowing the AI client to be easily mocked.
- **Explicit Dependency Injection**: Each module explicitly declares its dependencies, ensuring a clear and maintainable dependency graph.
- **Validation Layer**: Uses `Zod` to validate incoming WebSocket messages at runtime, ensuring the core logic only handles well-formed data.
- **Environment Safety**: Configuration is validated at startup using a schema, preventing the application from running with missing or invalid credentials.

## ⚙️ Prerequisites

- **Node.js**: v18 or later
- **Google AI API Key**: Get one from [Google AI Studio](https://aistudio.google.com/)

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd streaming-chat-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Add your Google API Key:
   ```env
   GOOGLE_AI_API_KEY=your_actual_api_key_here
   GOOGLE_AI_MODEL=gemini-3-flash-preview
   ```

## ▶️ Running the App

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The server runs on **port 3000** by default.

## 🔌 WebSocket API documentation

The backend exposes a Socket.io gateway namespace at `/` (default).

### Events

#### ➤ Client -> Server: `sendMessage`

Sends a prompt to the AI.

**Payload**:

```json
{
  "message": "Hello, tell me a joke!"
}
```

#### ➤ Server -> Client: `receiveMessage`

Emits chunks of the AI response or errors.

**Success Response (Streaming)**:

```json
{
  "role": "model",
  "content": "Why did the...", // Token chunk
  "done": false
}
```

**Completion**:

```json
{
  "role": "model",
  "content": "",
  "done": true
}
```

**Error**:

```json
{
  "role": "model",
  "content": "",
  "error": "Error message description",
  "done": true
}
```
