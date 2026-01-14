import { callClaude } from "./anthropic.js";
import { callOpenAI } from "./openai.js";

export type AIProvider = "claude" | "openai";

export interface AICallParams {
  system: string;
  user: string;
  maxTokens: number;
}

/**
 * Calls the AI with automatic fallback from Claude to OpenAI
 * if Claude fails (rate limit, quota exceeded, etc.)
 */
export async function callAI(params: AICallParams): Promise<string> {
  const preferredProvider = (process.env.AI_PROVIDER as AIProvider) || "claude";
  const enableFallback = process.env.AI_FALLBACK !== "false";

  const providers: AIProvider[] =
    preferredProvider === "claude" ? ["claude", "openai"] : ["openai", "claude"];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`Calling ${provider}...`);
      if (provider === "claude") {
        return await callClaude(params);
      } else {
        return await callOpenAI(params);
      }
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message.toLowerCase();

      // Check if this is a rate limit / quota error that should trigger fallback
      const isRateLimitError =
        errorMessage.includes("rate") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("limit") ||
        errorMessage.includes("429") ||
        errorMessage.includes("529") ||
        errorMessage.includes("overloaded");

      if (isRateLimitError && enableFallback && providers.indexOf(provider) < providers.length - 1) {
        console.warn(`${provider} failed with rate limit/quota error, trying fallback...`);
        console.warn(`Error: ${lastError.message}`);
        continue;
      }

      // Not a fallback-worthy error, or fallback disabled, or no more providers
      throw lastError;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error("All AI providers failed");
}

/**
 * Check which providers are configured
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (process.env.ANTHROPIC_API_KEY) providers.push("claude");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  return providers;
}
