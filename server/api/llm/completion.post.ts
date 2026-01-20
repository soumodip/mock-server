import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { validatePermission } from '../../utils/auth';

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

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResult {
  content: string;
  data?: any;
  usage?: any;
}

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string()
});

const completionRequestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  responseFormat: z.enum(['text', 'json']).optional().default('text')
});

async function getLLMConfig(): Promise<LLMConfig | null> {
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

  if (activeProvider !== 'ollama' && !providerConfig.apiKey) {
    return null;
  }

  const llmConfig: LLMConfig = {
    provider: activeProvider,
    config: {},
    globalParams: settings.llm.globalParams || {
      temperature: 0.7,
      max_tokens: 4096
    }
  };

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
}

async function unifiedChatCompletion(
  settings: LLMConfig,
  messages: Message[],
  responseFormat: 'text' | 'json' = 'text'
): Promise<CompletionResult> {
  const { provider, config, globalParams } = settings;
  const temp = globalParams?.temperature ?? 0.7;

  if (!config.apiKey && provider !== 'ollama') {
    throw new Error(`Missing API Key for provider: ${provider}`);
  }

  let finalMessages = [...messages];
  if (globalParams?.system_prompt && !finalMessages.find(m => m.role === 'system')) {
    finalMessages.unshift({ role: 'system', content: globalParams.system_prompt });
  }

  if (responseFormat === 'json') {
    const jsonInstruction = " IMPORTANT: Output ONLY valid JSON. Do not add markdown formatting or explanations.";
    const sysIndex = finalMessages.findIndex(m => m.role === 'system');
    if (sysIndex > -1) {
      finalMessages[sysIndex]!.content += jsonInstruction;
    } else {
      finalMessages.unshift({ role: 'system', content: jsonInstruction });
    }
  }

  let response: Response;
  let responseData: any;

  // ANTHROPIC
  if (provider === 'anthropic') {
    const systemMessage = finalMessages.find(m => m.role === 'system');
    const userMessages = finalMessages.filter(m => m.role !== 'system');

    response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: globalParams?.max_tokens || 4096,
        temperature: temp,
        system: systemMessage?.content,
        messages: userMessages
      })
    });
  }
  // AZURE
  else if (provider === 'azure') {
    const azureUrl = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${config.apiVersion}`;

    response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'api-key': config.apiKey!,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        messages: finalMessages,
        temperature: temp,
        max_tokens: globalParams?.max_tokens,
        response_format: responseFormat === 'json' ? { type: "json_object" } : undefined
      })
    });
  }
  // OPENAI / OLLAMA
  else {
    let url = config.baseUrl || "https://api.openai.com/v1";
    if (!url.endsWith('/v1') && provider === 'ollama') url = `${url}/v1`;
    if (!url.endsWith('/chat/completions')) url = `${url}/chat/completions`;

    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: finalMessages,
        temperature: temp,
        max_tokens: globalParams?.max_tokens,
        response_format: (provider === 'openai' && responseFormat === 'json')
          ? { type: "json_object" }
          : undefined
      })
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API Error (${response.status}): ${errorText}`);
  }

  responseData = await response.json();

  let content = "";

  if (provider === 'anthropic') {
    content = responseData.content[0].text;
  } else {
    content = responseData.choices[0].message.content;
  }

  let parsedJson = null;
  if (responseFormat === 'json') {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedJson = JSON.parse(cleanContent);
    } catch (e) {
      console.warn("Failed to parse JSON from LLM response. Returning raw text.");
    }
  }

  return {
    content: content,
    data: parsedJson,
    usage: responseData.usage || responseData.usage_metadata
  };
}

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const body = await readBody(event);
    const validated = completionRequestSchema.parse(body);

    const llmConfig = await getLLMConfig();

    if (!llmConfig) {
      throw createError({
        statusCode: 400,
        message: 'No LLM provider configured. Please configure an LLM provider in settings.',
      });
    }

    const result = await unifiedChatCompletion(
      llmConfig,
      validated.messages,
      validated.responseFormat
    );

    return result;
  } catch (error: any) {
    console.error('Error in LLM completion:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get LLM completion',
    });
  }
});
