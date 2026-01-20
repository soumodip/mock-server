import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import { z } from 'zod';
import { existsSync } from 'fs';

const providerConfigSchema = z.object({
  openai: z.object({
    baseUrl: z.string(),
    apiKey: z.string(),
    model: z.string(),
  }),
  anthropic: z.object({
    baseUrl: z.string(),
    apiKey: z.string(),
    model: z.string(),
  }),
  ollama: z.object({
    baseUrl: z.string(),
    model: z.string(),
  }),
  azure: z.object({
    endpoint: z.string(),
    apiKey: z.string(),
    deploymentName: z.string(),
    apiVersion: z.string(),
  }),
});

const settingsSchema = z.object({
  llm: z.object({
    active_provider: z.enum(['openai', 'anthropic', 'ollama', 'azure']),
    providers: providerConfigSchema,
  }),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const body = await readBody(event);
    const validated = settingsSchema.parse(body);

    const filePath = resolve(process.cwd(), 'data/settings.json');

    // Read existing settings to preserve any additional fields
    let existingSettings = {};
    if (existsSync(filePath)) {
      try {
        const data = await readFile(filePath, 'utf-8');
        existingSettings = JSON.parse(data);
      } catch (error) {
        console.error('Error reading existing settings:', error);
      }
    }

    // Merge with new settings
    const updatedSettings = {
      ...existingSettings,
      llm: validated.llm,
    };

    await writeFile(filePath, JSON.stringify(updatedSettings, null, 2));

    return updatedSettings;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to save settings',
    });
  }
});
