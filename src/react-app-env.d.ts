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


// Shared self.ai APIs

// interface Window {
//   ai: AI;
// }

// interface WorkerGlobalScope {
//   ai: AI;
// }

// interface AI {
//   languageModel: AILanguageModelFactory;
// }

// interface AICreateMonitor extends EventTarget {
//   ondownloadprogress: ((this: AICreateMonitor, ev: ProgressEvent) => any) | null;
// }

// type AICreateMonitorCallback = (monitor: AICreateMonitor) => void;

// type AICapabilityAvailability = "readily" | "after-download" | "no";

// // LanguageModel

// interface AILanguageModelFactory {
//   create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
//   capabilities(): Promise<AILanguageModelCapabilities>;
// }

// interface AILanguageModel extends EventTarget {
//   prompt(input: string, options?: AILanguageModelPromptOptions): Promise<string>;
//   promptStreaming(input: string, options?: AILanguageModelPromptOptions): ReadableStream;

//   countPromptTokens(input: string, options?: AILanguageModelPromptOptions): Promise<number>;
//   readonly maxTokens: number;
//   readonly tokensSoFar: number;
//   readonly tokensLeft: number;
//   readonly topK: number;
//   readonly temperature: number;

//   clone(): Promise<AILanguageModel>;
//   destroy(): void;
// }

// interface AILanguageModelCapabilities {
//   readonly available: AICapabilityAvailability;

//   // Always null if available === "no"
//   readonly defaultTopK: number | null;
//   readonly maxTopK: number | null;
//   readonly defaultTemperature: number | null;
// }

// interface AILanguageModelCreateOptions {
//   signal?: AbortSignal;
//   monitor?: AICreateMonitorCallback;

//   systemPrompt?: string;
//   initialPrompts?: AILanguageModelPrompt[];
//   topK?: number;
//   temperature?: number;
// }

// interface AILanguageModelPrompt {
//   role: AILanguageModelPromptRole;
//   content: string;
// }

// interface AILanguageModelPromptOptions {
//   signal?: AbortSignal;
// }

// type AILanguageModelPromptRole = "system" | "user" | "assistant";