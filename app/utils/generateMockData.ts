import type { ObjectSchema, ObjectField } from '~/stores/object';

/**
 * Generates random mock data based on an object schema
 */
export function generateMockData(
  schema: ObjectSchema,
  objectsMap: Map<string, ObjectSchema>,
  depth = 0,
  projectAccessToken?: string
): any {
  if (depth > 3) return null; // Prevent deep nesting

  const result: any = {};

  for (const field of schema.fields) {
    result[field.name] = generateFieldValue(field, objectsMap, depth, projectAccessToken);
  }

  return result;
}

function generateFieldValue(
  field: ObjectField,
  objectsMap: Map<string, ObjectSchema>,
  depth: number,
  projectAccessToken?: string
): any {
  switch (field.type) {
    case 'string':
      return generateRandomString(field.name, projectAccessToken);
    case 'number':
      return generateRandomNumber(field.name);
    case 'boolean':
      return Math.random() > 0.5;
    case 'object':
      if (field.ref && objectsMap.has(field.ref)) {
        const refSchema = objectsMap.get(field.ref)!;
        return generateMockData(refSchema, objectsMap, depth + 1, projectAccessToken);
      }
      return {};
    case 'object-json':
      return {};
    case 'array':
      if (field.ref && objectsMap.has(field.ref)) {
        const refSchema = objectsMap.get(field.ref)!;
        const arrayLength = Math.floor(Math.random() * 3) + 1; // 1-3 items
        return Array.from({ length: arrayLength }, () =>
          generateMockData(refSchema, objectsMap, depth + 1, projectAccessToken)
        );
      }
      return [];
    case 'array-string': {
      const arrayLength = Math.floor(Math.random() * 3) + 1; // 1-3 items
      return Array.from({ length: arrayLength }, () =>
        generateRandomString(field.name, projectAccessToken)
      );
    }
    case 'array-number': {
      const arrayLength = Math.floor(Math.random() * 3) + 1; // 1-3 items
      return Array.from({ length: arrayLength }, () =>
        generateRandomNumber(field.name)
      );
    }
    default:
      return null;
  }
}

function generateRandomString(fieldName: string, projectAccessToken?: string): string {
  const lowerFieldName = fieldName.toLowerCase();

  // Return project access token for access_token or accesstoken fields
  if (projectAccessToken && (lowerFieldName === 'access_token' || lowerFieldName === 'accesstoken')) {
    return projectAccessToken;
  }

  // Generate contextual strings based on field name
  if (lowerFieldName.includes('email')) {
    return `user${Math.floor(Math.random() * 1000)}@example.com`;
  }
  if (lowerFieldName.includes('name') || lowerFieldName.includes('first')) {
    const names = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
    return names[Math.floor(Math.random() * names.length)]!;
  }
  if (lowerFieldName.includes('last')) {
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    return lastNames[Math.floor(Math.random() * lastNames.length)]!;
  }
  if (lowerFieldName.includes('phone')) {
    return `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
  if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) {
    return `https://example.com/${Math.random().toString(36).substring(7)}`;
  }
  if (lowerFieldName.includes('date') || lowerFieldName.includes('time') || lowerFieldName.includes('created') || lowerFieldName.includes('updated')) {
    return new Date(Date.now() - Math.random() * 31536000000).toISOString();
  }
  if (lowerFieldName.includes('id')) {
    return Math.random().toString(36).substring(2, 11);
  }
  if (lowerFieldName.includes('password')) {
    return '********';
  }
  if (lowerFieldName.includes('description') || lowerFieldName.includes('message') || lowerFieldName.includes('bio')) {
    return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  }
  if (lowerFieldName.includes('title') || lowerFieldName.includes('subject')) {
    const titles = ['Hello World', 'Sample Title', 'Test Subject', 'Mock Data'];
    return titles[Math.floor(Math.random() * titles.length)]!;
  }
  if (lowerFieldName.includes('address')) {
    return `${Math.floor(Math.random() * 9999) + 1} Main St, Anytown, USA`;
  }
  if (lowerFieldName.includes('city')) {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    return cities[Math.floor(Math.random() * cities.length)]!;
  }
  if (lowerFieldName.includes('country')) {
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany'];
    return countries[Math.floor(Math.random() * countries.length)]!;
  }
  if (lowerFieldName.includes('color')) {
    const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
    return colors[Math.floor(Math.random() * colors.length)]!;
  }
  if (lowerFieldName.includes('company')) {
    const companies = ['Acme Corp', 'Globex Inc', 'Soylent Corp', 'Initech', 'Umbrella Corp'];
    return companies[Math.floor(Math.random() * companies.length)]!;
  }

  // Default random string
  return `sample_${Math.random().toString(36).substring(2, 10)}`;
}

function generateRandomNumber(fieldName: string): number {
  const lowerFieldName = fieldName.toLowerCase();

  if (lowerFieldName.includes('age')) {
    return Math.floor(Math.random() * 60) + 18;
  }
  if (lowerFieldName.includes('price') || lowerFieldName.includes('amount') || lowerFieldName.includes('cost')) {
    return Math.floor(Math.random() * 10000) / 100; // 0.00 - 100.00
  }
  if (lowerFieldName.includes('quantity') || lowerFieldName.includes('count')) {
    return Math.floor(Math.random() * 100) + 1;
  }
  if (lowerFieldName.includes('year')) {
    return Math.floor(Math.random() * 30) + 1994; // 1994-2024
  }

  // Default random number
  return Math.floor(Math.random() * 1000);
}
