import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

export type ProviderType = 'openai' | 'anthropic' | 'azure' | 'ollama';

export interface LLMConfig {
  provider: ProviderType;
  config: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    endpoint?: string;
    deploymentName?: string;
    apiVersion?: string;
  };
  globalParams?: {
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
  };
}

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const filePath = resolve(process.cwd(), 'data/settings.json');

    if (!existsSync(filePath)) {
      return null;
    }

    const data = await readFile(filePath, 'utf-8');
    const settings = JSON.parse(data);

    if (!settings.llm || !settings.llm.active_provider || !settings.llm.providers) {
      return null;
    }

    const activeProvider = settings.llm.active_provider as ProviderType;
    const providerConfig = settings.llm.providers[activeProvider];

    if (!providerConfig) {
      return null;
    }

    // Check if the provider has a valid API key (except ollama which doesn't need one)
    if (activeProvider !== 'ollama' && !providerConfig.apiKey) {
      return null;
    }

    // Build the LLMConfig object
    const llmConfig: LLMConfig = {
      provider: activeProvider,
      config: {},
      globalParams: settings.llm.globalParams || {
        temperature: 0.7,
        max_tokens: 4096
      }
    };

    // Map provider-specific config
    if (activeProvider === 'openai') {
      llmConfig.config = {
        apiKey: providerConfig.apiKey,
        baseUrl: providerConfig.baseUrl || 'https://api.openai.com/v1',
        model: providerConfig.model || 'gpt-4-turbo'
      };
    } else if (activeProvider === 'anthropic') {
      llmConfig.config = {
        apiKey: providerConfig.apiKey,
        baseUrl: providerConfig.baseUrl || 'https://api.anthropic.com',
        model: providerConfig.model || 'claude-3-sonnet-20240229'
      };
    } else if (activeProvider === 'ollama') {
      llmConfig.config = {
        baseUrl: providerConfig.baseUrl || 'http://localhost:11434',
        model: providerConfig.model || 'llama3'
      };
    } else if (activeProvider === 'azure') {
      llmConfig.config = {
        apiKey: providerConfig.apiKey,
        endpoint: providerConfig.endpoint,
        deploymentName: providerConfig.deploymentName,
        apiVersion: providerConfig.apiVersion || '2023-05-15'
      };
    }

    return llmConfig;
  } catch (error) {
    console.error('Error reading LLM config:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to read LLM configuration',
    });
  }
});
