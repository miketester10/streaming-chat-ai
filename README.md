# Streaming Chat AI Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
  <a href="https://socket.io/" target="blank"><img src="https://socket.io/images/logo.svg" width="120" alt="Socket.io Logo" /></a>
</p>

Backend service for a real-time streaming chat application powered by **NestJS**, **Socket.io**, and **Google Gemini AI**.

This project demonstrates a production-ready approach to handling WebSocket connections and streaming AI responses with TypeScript.

## 🚀 Features

- **Real-time Communication**: Full-duplex communication using WebSockets (Socket.io).
- **Multi-turn Conversations**: Support for chat history to maintain context throughout the session.
- **AI Streaming**: Integration with Google Gemini for low-latency token streaming.
- **System Instructions**: Customizable AI personality and instructions for refined responses.
- **Robust Validation**: Complex Zod schemas for runtime payload and history validation.
- **Authentication**: JWT-based authentication for secure WebSocket communication.
- **Concurrency Control**: Manages multiple sessions and user aborts gracefully.
- **Type Safety**: Strictly typed events and DTOs using TypeScript.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **WebSockets**: `@nestjs/websockets`, `socket.io`
- **AI Model**: Google Generative AI (Gemini 3 Pro)
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

## 🔐 Authentication

The application uses **JWT (JSON Web Token)** to protect the chat socket.

### ➤ Login

To obtain a token, send a POST request to `/auth/login`.

**Endpoint**: `POST /auth/login`

**Payload**:

```json
{
  "email": "admin@admin.com",
  "password": "123456"
}
```

**Response**:

```json
{
  "access_token": "your_jwt_token_here"
}
```

> [!TIP]
> Use the credentials above for testing purposes.

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

### Authentication

To connect to the WebSocket, you must provide the JWT token obtained from the login step. You can provide it in two ways:

1.  **Handshake Connection**: Use the `auth` object in the Socket.io client options.

    ```javascript
    const socket = io('http://localhost:3000', {
      auth: {
        token: 'your_jwt_token_here',
      },
    });
    ```

2.  **Authorization Header**: Pass it in the headers during connection.
    ```javascript
    const socket = io('http://localhost:3000', {
      extraHeaders: {
        Authorization: 'Bearer your_jwt_token_here',
      },
    });
    ```

> [!IMPORTANT]
> The `sendMessage` event is protected by a Guard. If the token is missing or invalid, the server will throw a `WsException`.

### Events

#### ➤ Client -> Server: `sendMessage`

Sends a prompt to the AI along with the conversation history.

**Payload**:

```json
{
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "Hello!" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "Hi there! How can I help you today?" }]
    }
  ],
  "newMessage": "Tell me a joke!"
}
```

> [!NOTE]
> The `history` field is validated to ensure it follows the correct structure and length limits (max 6 messages).

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
  "role": "system",
  "content": "",
  "error": "Error message description",
  "done": true
}
```
