import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const filePath = resolve(process.cwd(), 'data/settings.json');

    // Check if file exists
    if (!existsSync(filePath)) {
      // Return default settings if file doesn't exist
      return {
        llm: {
          active_provider: 'openai',
          providers: {
            openai: {
              baseUrl: 'https://api.openai.com/v1',
              apiKey: '',
              model: 'gpt-4-turbo'
            },
            anthropic: {
              baseUrl: 'https://api.anthropic.com',
              apiKey: '',
              model: 'claude-3-sonnet-20240229'
            },
            ollama: {
              baseUrl: 'http://localhost:11434',
              model: 'llama3'
            },
            azure: {
              endpoint: 'https://my-resource.openai.azure.com',
              apiKey: '',
              deploymentName: 'my-gpt4-deployment',
              apiVersion: '2023-05-15'
            }
          }
        }
      };
    }

    const data = await readFile(filePath, 'utf-8');
    const settings = JSON.parse(data);

    return settings;
  } catch (error) {
    console.error('Error reading settings:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to read settings',
    });
  }
});
