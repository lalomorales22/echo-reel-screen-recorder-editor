# EchoReel: AI-Powered Screen Recording & Editing
![Screenshot 2025-06-06 at 1 05 31 PM](https://github.com/user-attachments/assets/0a60c9d8-fb17-4a40-9377-09f3d73c1c0f)

EchoReel is a web application designed to simplify screen recording and enhance video editing with the power of Artificial Intelligence. Users can easily capture their screen, generate edit decision lists (EDLs) automatically, create voiceover scripts from video content, and generate time-synced captions.

## Key Features

*   **Screen Recording:** Capture your screen with optional microphone input.
*   **AI Edit Suggestions:** Automatically generate an Edit Decision List (EDL) with suggestions for cuts, zooms, and highlights.
*   **AI Voiceover Script Generation:** Create voiceover scripts based on the content of your screen recording.
*   **AI Caption Generation:** Generate time-synced captions (SRT format) from the video's audio.
*   **Interactive Timeline Editor:** Visualize and manage video, AI edits, voiceovers, and captions on a timeline.
*   **Video Preview:** Instantly preview your recorded and edited video.
*   **Export Options:** (Simulated) Choose format, aspect ratio, and resolution for final video output.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI Components, Tailwind CSS
*   **AI Integration:** Genkit (for calling AI models like Gemini)
*   **State Management:** React Hooks (useState, useEffect, useCallback, useRef)

## Getting Started

Follow these steps to get EchoReel running locally on your machine.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### 1. Clone the Repository

Clone this repository to your local machine:

```bash
git clone https://github.com/lalomorales22/echo-reel-screen-recorder-editor.git
cd echo-reel-screen-recorder-editor
```

### 2. Install Dependencies

Install the project dependencies using npm or yarn:

```bash
npm install
# or
# yarn install
```

### 3. Set Up Environment Variables (Optional but Recommended for Genkit)

EchoReel uses Genkit for AI features, which typically connects to Google AI Studio (Gemini models). To enable these AI features, you'll need to set up your Google AI API key.

1.  Create a `.env` file in the root of the project by copying the example (if one exists, otherwise create it):
    ```
    # .env
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
    ```
2.  Replace `YOUR_GOOGLE_AI_API_KEY` with your actual API key from Google AI Studio.

### 4. Run the Development Servers

EchoReel requires two development servers to run simultaneously:

*   **Next.js frontend server:** Serves the web application.
*   **Genkit development server:** Manages and serves the AI flows.

Open two terminal windows or tabs in your project directory.

**In the first terminal, start the Next.js development server:**

```bash
npm run dev
```

This will typically start the application on `http://localhost:9002`.

**In the second terminal, start the Genkit development server:**

```bash
npm run genkit:dev
# or for watching changes to AI flows:
# npm run genkit:watch
```

The Genkit server usually starts on `http://localhost:4000` (for its UI/inspector) and handles AI flow requests from the Next.js app.

### 5. Open the App

Once both servers are running, open your browser and navigate to `http://localhost:9002` (or the port Next.js started on) to use EchoReel.

## Project Structure

*   `src/app/`: Contains the Next.js pages and layout. `page.tsx` is the main entry point.
*   `src/components/`: Reusable React components.
    *   `modules/`: Larger feature modules (Screen Capture, AI Tools, Export).
    *   `editor/`: Components related to the timeline editor.
    *   `video/`: Video preview component.
    *   `ui/`: ShadCN UI components.
*   `src/ai/`: Genkit related files.
    *   `flows/`: AI flow definitions (e.g., caption generation, EDL generation).
    *   `genkit.ts`: Genkit initialization and configuration.
*   `src/lib/`: Utility functions.
*   `src/hooks/`: Custom React hooks.
*   `public/`: Static assets.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.
```
