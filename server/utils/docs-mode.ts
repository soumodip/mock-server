export function isDocsModeEnabled(): boolean {
  return process.env.IS_DOCS_MODE === 'true';
}

export function validateDocsMode(event: any, options?: { allowedPaths?: string[] }) {
  if (!isDocsModeEnabled()) {
    return;
  }

  const path = event.path || '';

  // Check if the path is allowed even in docs mode
  if (options?.allowedPaths) {
    for (const allowedPath of options.allowedPaths) {
      if (path.includes(allowedPath)) {
        return;
      }
    }
  }

  throw createError({
    statusCode: 403,
    message: 'API modifications are disabled in documentation mode',
  });
}
