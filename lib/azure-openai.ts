import OpenAI, { AzureOpenAI } from "openai";

const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o";

export type AIClient = OpenAI | AzureOpenAI;

export function getAIClient(): { client: AIClient; model: string } {
  // DeepSeek: cheap, large context, great for HTML/CSS/JS editing
  if (deepseekApiKey) {
    return {
      client: new OpenAI({
        apiKey: deepseekApiKey,
        baseURL: "https://api.deepseek.com",
        timeout: 120000,
      }),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }

  if (azureEndpoint && azureApiKey && azureDeployment) {
    return {
      client: new AzureOpenAI({
        endpoint: azureEndpoint,
        apiKey: azureApiKey,
        deployment: azureDeployment,
        apiVersion: "2024-08-01-preview",
        timeout: 120000,
      }),
      model: azureDeployment,
    };
  }

  if (openaiApiKey) {
    return {
      client: new OpenAI({ apiKey: openaiApiKey, timeout: 120000 }),
      model: openaiModel,
    };
  }

  throw new Error(
    "No AI configured. Set DEEPSEEK_API_KEY, AZURE_OPENAI_* env vars, OR OPENAI_API_KEY."
  );
}

export function getDeploymentName(): string {
  return (
    azureDeployment ??
    (deepseekApiKey ? "deepseek-chat" : openaiApiKey ? "gpt-4o-mini" : "")
  );
}
