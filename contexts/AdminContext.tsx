import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { 
  AdminUser, 
  AdminRole, 
  Permission, 
  PermissionModule, 
  PermissionAction 
} from '@/types/admin';

const ADMIN_STORAGE_KEY = 'admin_auth';
const ADMIN_USER_STORAGE_KEY = 'admin_user';

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'users', actions: ['create', 'read', 'update', 'delete', 'suspend', 'ban'] },
    { module: 'merchants', actions: ['create', 'read', 'update', 'delete', 'suspend', 'ban', 'approve', 'reject'] },
    { module: 'bookings', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'payments', actions: ['read', 'update', 'refund', 'export'] },
    { module: 'payouts', actions: ['read', 'update', 'payout', 'approve', 'reject', 'export'] },
    { module: 'disputes', actions: ['read', 'update', 'moderate', 'escalate'] },
    { module: 'tickets', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'messages', actions: ['read', 'moderate', 'delete'] },
    { module: 'kyc', actions: ['read', 'approve', 'reject', 'escalate'] },
    { module: 'ad_boosts', actions: ['create', 'read', 'update', 'delete', 'approve', 'reject'] },
    { module: 'analytics', actions: ['read', 'export'] },
    { module: 'settings', actions: ['read', 'update'] },
    { module: 'audit_logs', actions: ['read', 'export'] },
    { module: 'kb_articles', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'notifications', actions: ['create', 'read', 'update', 'delete'] },
  ],
  ops_admin: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'users', actions: ['read', 'update'] },
    { module: 'merchants', actions: ['read', 'update', 'suspend', 'approve', 'reject'] },
    { module: 'bookings', actions: ['read', 'update'] },
    { module: 'payments', actions: ['read', 'export'] },
    { module: 'payouts', actions: ['read', 'export'] },
    { module: 'disputes', actions: ['read', 'update'] },
    { module: 'tickets', actions: ['read', 'update'] },
    { module: 'kyc', actions: ['read', 'approve', 'reject'] },
    { module: 'ad_boosts', actions: ['read', 'update', 'approve', 'reject'] },
    { module: 'analytics', actions: ['read', 'export'] },
    { module: 'audit_logs', actions: ['read'] },
  ],
  finance_admin: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'payments', actions: ['read', 'refund', 'export'] },
    { module: 'payouts', actions: ['read', 'approve', 'reject', 'payout', 'export'] },
    { module: 'disputes', actions: ['read'] },
    { module: 'analytics', actions: ['read', 'export'] },
    { module: 'audit_logs', actions: ['read'] },
  ],
  trust_safety: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'users', actions: ['read', 'suspend', 'ban'] },
    { module: 'merchants', actions: ['read', 'suspend', 'ban'] },
    { module: 'disputes', actions: ['read', 'update', 'moderate', 'escalate'] },
    { module: 'messages', actions: ['read', 'moderate', 'delete'] },
    { module: 'kyc', actions: ['read', 'approve', 'reject', 'escalate'] },
    { module: 'tickets', actions: ['read', 'update'] },
    { module: 'audit_logs', actions: ['read'] },
  ],
  cs_agent: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'users', actions: ['read'] },
    { module: 'merchants', actions: ['read'] },
    { module: 'bookings', actions: ['read', 'update'] },
    { module: 'disputes', actions: ['create', 'read', 'update'] },
    { module: 'tickets', actions: ['create', 'read', 'update'] },
    { module: 'messages', actions: ['read'] },
    { module: 'payments', actions: ['read'] },
    { module: 'kb_articles', actions: ['read'] },
  ],
  cs_lead: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'users', actions: ['read'] },
    { module: 'merchants', actions: ['read'] },
    { module: 'bookings', actions: ['read', 'update'] },
    { module: 'disputes', actions: ['create', 'read', 'update', 'escalate'] },
    { module: 'tickets', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'messages', actions: ['read', 'moderate'] },
    { module: 'payments', actions: ['read', 'refund'] },
    { module: 'analytics', actions: ['read'] },
    { module: 'kb_articles', actions: ['create', 'read', 'update'] },
  ],
  auditor: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'users', actions: ['read'] },
    { module: 'merchants', actions: ['read'] },
    { module: 'bookings', actions: ['read'] },
    { module: 'payments', actions: ['read', 'export'] },
    { module: 'payouts', actions: ['read', 'export'] },
    { module: 'disputes', actions: ['read'] },
    { module: 'tickets', actions: ['read'] },
    { module: 'analytics', actions: ['read', 'export'] },
    { module: 'audit_logs', actions: ['read', 'export'] },
  ],
};

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadAdminAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('[Admin] Fetching admin data for user:', firebaseUser.uid);
          const adminDocRef = doc(db, 'admins', firebaseUser.uid);
          
          let adminDoc;
          try {
            adminDoc = await getDoc(adminDocRef);
          } catch (firestoreError: any) {
            if (firestoreError.code === 'unavailable') {
              console.log('[Admin] Firestore unavailable, trying cache...');
              try {
                adminDoc = await getDocFromCache(adminDocRef);
              } catch (cacheError) {
                console.log('[Admin] No cached data, using stored admin');
                const storedAdmin = await AsyncStorage.getItem(ADMIN_USER_STORAGE_KEY);
                if (storedAdmin) {
                  const parsedAdmin = JSON.parse(storedAdmin);
                  setAdminUser(parsedAdmin);
                  setIsAuthenticated(true);
                }
                return;
              }
            } else {
              throw firestoreError;
            }
          }

          if (adminDoc && adminDoc.exists()) {
            const adminData = adminDoc.data();
            const admin: AdminUser = {
              id: firebaseUser.uid,
              email: adminData.email,
              name: adminData.name,
              role: adminData.role,
              permissions: adminData.permissions || ROLE_PERMISSIONS[adminData.role as AdminRole],
              mfaEnabled: adminData.mfaEnabled || false,
              lastLogin: new Date().toISOString(),
              ipAllowlist: adminData.ipAllowlist,
              status: adminData.status || 'active',
              createdAt: adminData.createdAt,
              updatedAt: adminData.updatedAt || new Date().toISOString(),
            };

            await AsyncStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(admin));
            setAdminUser(admin);
            setIsAuthenticated(true);
            console.log('[Admin] Admin data loaded successfully');
          } else {
            const storedAdmin = await AsyncStorage.getItem(ADMIN_USER_STORAGE_KEY);
            if (storedAdmin) {
              console.log('[Admin] Using stored admin data');
              const parsedAdmin = JSON.parse(storedAdmin);
              setAdminUser(parsedAdmin);
              setIsAuthenticated(true);
            }
          }
        } catch (error) {
          console.error('[Admin] Failed to load admin data:', error);
          const storedAdmin = await AsyncStorage.getItem(ADMIN_USER_STORAGE_KEY);
          if (storedAdmin) {
            console.log('[Admin] Using fallback cached admin');
            const parsedAdmin = JSON.parse(storedAdmin);
            setAdminUser(parsedAdmin);
            setIsAuthenticated(true);
          }
        }
      } else {
        setAdminUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadAdminAuth = async () => {
    try {
      console.log('[Admin] Loading admin auth state...');
      const adminData = await AsyncStorage.getItem(ADMIN_USER_STORAGE_KEY);

      if (adminData) {
        const parsedAdmin = JSON.parse(adminData);
        console.log('[Admin] Found cached admin data');
        setAdminUser(parsedAdmin);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('[Admin] Failed to load admin auth:', error);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('[Admin] Login attempt for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log('[Admin] Fetching admin document for:', firebaseUser.uid);
      const adminDocRef = doc(db, 'admins', firebaseUser.uid);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists()) {
        await firebaseSignOut(auth);
        return { success: false, error: 'Admin account not found' };
      }

      if (adminDoc.data().status !== 'active') {
        await firebaseSignOut(auth);
        return { success: false, error: 'Admin account is not active' };
      }

      const adminData = adminDoc.data();
      const admin: AdminUser = {
        id: firebaseUser.uid,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        permissions: adminData.permissions || ROLE_PERMISSIONS[adminData.role as AdminRole],
        mfaEnabled: adminData.mfaEnabled || false,
        lastLogin: new Date().toISOString(),
        ipAllowlist: adminData.ipAllowlist,
        status: adminData.status,
        createdAt: adminData.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(admin));
      setAdminUser(admin);
      setIsAuthenticated(true);
      console.log('[Admin] Login successful');

      return { success: true, admin };
    } catch (error: any) {
      console.error('[Admin] Login failed:', error);
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[Admin] Logging out...');
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem(ADMIN_USER_STORAGE_KEY);
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);

      setAdminUser(null);
      setIsAuthenticated(false);
      console.log('[Admin] Logout successful');
    } catch (error) {
      console.error('[Admin] Logout failed:', error);
      throw error;
    }
  }, []);

  const hasPermission = useCallback((module: PermissionModule, action: PermissionAction): boolean => {
    if (!adminUser) return false;
    
    const modulePermission = adminUser.permissions.find(p => p.module === module);
    if (!modulePermission) return false;
    
    return modulePermission.actions.includes(action);
  }, [adminUser]);

  const hasAnyPermission = useCallback((module: PermissionModule, actions: PermissionAction[]): boolean => {
    if (!adminUser) return false;
    
    const modulePermission = adminUser.permissions.find(p => p.module === module);
    if (!modulePermission) return false;
    
    return actions.some(action => modulePermission.actions.includes(action));
  }, [adminUser]);

  const hasAllPermissions = useCallback((module: PermissionModule, actions: PermissionAction[]): boolean => {
    if (!adminUser) return false;
    
    const modulePermission = adminUser.permissions.find(p => p.module === module);
    if (!modulePermission) return false;
    
    return actions.every(action => modulePermission.actions.includes(action));
  }, [adminUser]);

  const canAccessModule = useCallback((module: PermissionModule): boolean => {
    if (!adminUser) return false;
    return adminUser.permissions.some(p => p.module === module);
  }, [adminUser]);

  const isSuperAdmin = useMemo(() => adminUser?.role === 'super_admin', [adminUser]);
  const isOpsAdmin = useMemo(() => adminUser?.role === 'ops_admin', [adminUser]);
  const isFinanceAdmin = useMemo(() => adminUser?.role === 'finance_admin', [adminUser]);
  const isTrustSafety = useMemo(() => adminUser?.role === 'trust_safety', [adminUser]);
  const isCSAgent = useMemo(() => adminUser?.role === 'cs_agent', [adminUser]);
  const isCSLead = useMemo(() => adminUser?.role === 'cs_lead', [adminUser]);
  const isAuditor = useMemo(() => adminUser?.role === 'auditor', [adminUser]);

  return useMemo(
    () => ({
      adminUser,
      isLoading,
      isAuthenticated,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessModule,
      isSuperAdmin,
      isOpsAdmin,
      isFinanceAdmin,
      isTrustSafety,
      isCSAgent,
      isCSLead,
      isAuditor,
      rolePermissions: ROLE_PERMISSIONS,
    }),
    [
      adminUser,
      isLoading,
      isAuthenticated,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessModule,
      isSuperAdmin,
      isOpsAdmin,
      isFinanceAdmin,
      isTrustSafety,
      isCSAgent,
      isCSLead,
      isAuditor,
    ]
  );
});
