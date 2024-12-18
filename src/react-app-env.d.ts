/// <reference types="react-scripts" />

// global.d.ts
export {};

declare global {
  interface Window {
    ai: {
      summarizer: {
        capabilities: () => Promise<{ available: string }>;
        create: (options: Record<string, unknown>) => Promise<{
          ready: Promise<void>;
          summarize: (text: string, options?: { context?: string }) => Promise<string>;
          addEventListener: (event: string, callback: EventListener) => void;  // Add event listener capability
        }>;
      };
    };
  }

  namespace chrome {
    interface aiOriginTrial {
      languageModel: {
        capabilities: () => Promise<{ available: string }>;
        create: (options: Record<string, unknown>) => Promise<{
          ready: Promise<void>;
          generateText: (prompt: string, options?: Record<string, unknown>) => Promise<string>;
        }>;
      };
    }

    const aiOriginTrial: aiOriginTrial;
  }
}