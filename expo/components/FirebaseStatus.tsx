import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { testFirebaseConnection } from '@/services/firestore/test';

interface StatusItem {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message?: string;
}

export function FirebaseStatus() {
  const { colors } = useTheme();
  const [statuses, setStatuses] = useState<StatusItem[]>([
    { name: 'Firebase Core', status: 'checking' },
    { name: 'Authentication', status: 'checking' },
    { name: 'Firestore', status: 'checking' },
    { name: 'Storage', status: 'checking' },
  ]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  const checkFirebaseStatus = async () => {
    try {
      const { app, auth, db, storage } = await import('@/config/firebase');

      const newStatuses: StatusItem[] = [];

      if (app) {
        newStatuses.push({
          name: 'Firebase Core',
          status: 'success',
          message: `Project: ${app.options.projectId}`,
        });
      } else {
        newStatuses.push({
          name: 'Firebase Core',
          status: 'error',
          message: 'Not initialized',
        });
      }

      if (auth) {
        newStatuses.push({
          name: 'Authentication',
          status: 'success',
          message: 'Ready',
        });
      } else {
        newStatuses.push({
          name: 'Authentication',
          status: 'error',
          message: 'Not initialized',
        });
      }

      if (db) {
        newStatuses.push({
          name: 'Firestore',
          status: 'success',
          message: 'Connected',
        });
      } else {
        newStatuses.push({
          name: 'Firestore',
          status: 'error',
          message: 'Not initialized',
        });
      }

      if (storage) {
        newStatuses.push({
          name: 'Storage',
          status: 'success',
          message: 'Ready',
        });
      } else {
        newStatuses.push({
          name: 'Storage',
          status: 'error',
          message: 'Not initialized',
        });
      }

      setStatuses(newStatuses);
    } catch (error) {
      console.error('Firebase status check failed:', error);
      setStatuses([
        {
          name: 'Firebase',
          status: 'error',
          message: 'Initialization failed',
        },
      ]);
    }
  };

  const runConnectionTest = async () => {
    setTesting(true);
    try {
      const success = await testFirebaseConnection();
      
      if (success) {
        setStatuses(prev =>
          prev.map(s =>
            s.name === 'Firestore'
              ? { ...s, status: 'success', message: 'Connection test passed' }
              : s
          )
        );
      } else {
        setStatuses(prev =>
          prev.map(s =>
            s.name === 'Firestore'
              ? { ...s, status: 'error', message: 'Connection test failed' }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setStatuses(prev =>
        prev.map(s =>
          s.name === 'Firestore'
            ? { ...s, status: 'error', message: 'Connection test failed' }
            : s
        )
      );
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <XCircle size={20} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={20} color="#f59e0b" />;
      case 'checking':
        return <ActivityIndicator size="small" color={colors.primary} />;
    }
  };

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'checking':
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Firebase Status</Text>

      {statuses.map((item, index) => (
        <View
          key={index}
          style={[styles.statusItem, { borderBottomColor: colors.border }]}
        >
          <View style={styles.statusLeft}>
            {getStatusIcon(item.status)}
            <View style={styles.statusText}>
              <Text style={[styles.statusName, { color: colors.text }]}>
                {item.name}
              </Text>
              {item.message && (
                <Text
                  style={[
                    styles.statusMessage,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.message}
                </Text>
              )}
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: colors.primary }]}
        onPress={runConnectionTest}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.testButtonText}>Test Connection</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Note: This component is for development only. Remove before production.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusMessage: {
    fontSize: 12,
    marginTop: 2,
  },
  testButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  note: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
});
