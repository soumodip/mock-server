export type Permission = 'read' | 'write' | 'delete';

export const useAuth = () => {
  const config = useRuntimeConfig();
  const isAuthEnabled = config.public.enableAuth === 'true';

  const logout = () => {
    if (!isAuthEnabled) {
      return;
    }

    // Clear the access token and permissions from localStorage
    if (import.meta.client) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('permissions');

      // Redirect to auth page
      navigateTo('/auth');
    }
  };

  const isAuthenticated = () => {
    if (!isAuthEnabled) {
      return true;
    }

    if (import.meta.client) {
      const token = localStorage.getItem('accessToken');
      return !!token;
    }

    return false;
  };

  const getPermissions = (): Permission[] => {
    // If auth is disabled, return all permissions
    if (!isAuthEnabled) {
      return ['read', 'write', 'delete'];
    }

    if (import.meta.client) {
      const permissionsStr = localStorage.getItem('permissions');
      if (permissionsStr) {
        try {
          return JSON.parse(permissionsStr) as Permission[];
        } catch {
          return [];
        }
      }
    }

    return [];
  };

  const hasPermission = (permission: Permission): boolean => {
    // If auth is disabled, always return true
    if (!isAuthEnabled) {
      return true;
    }

    const permissions = getPermissions();
    return permissions.includes(permission);
  };

  const canRead = (): boolean => hasPermission('read');
  const canWrite = (): boolean => hasPermission('write');
  const canDelete = (): boolean => hasPermission('delete');

  return {
    logout,
    isAuthenticated,
    isAuthEnabled,
    getPermissions,
    hasPermission,
    canRead,
    canWrite,
    canDelete
  };
};
