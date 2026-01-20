import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const filePath = resolve(process.cwd(), 'data/projects.json');
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
});
