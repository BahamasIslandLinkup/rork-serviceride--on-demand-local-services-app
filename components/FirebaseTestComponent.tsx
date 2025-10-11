import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { testFirebaseConnection, createTestRecord, getTestRecords } from '@/services/firestore/test-connection';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle, XCircle, Database, RefreshCw } from 'lucide-react-native';

export default function FirebaseTestComponent() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    recordId?: string;
    recordCount?: number;
  } | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const testResult = await testFirebaseConnection();
      setResult(testResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async () => {
    setLoading(true);
    try {
      const recordId = await createTestRecord();
      setResult({
        success: true,
        message: 'Record created successfully!',
        recordId,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecords = async () => {
    setLoading(true);
    try {
      const records = await getTestRecords();
      setResult({
        success: true,
        message: 'Records retrieved successfully!',
        recordCount: records.length,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Database size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Firebase Connection Test
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Test your Firestore database connection
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleTest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.buttonText}>Run Full Test</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleCreateRecord}
            disabled={loading}
          >
            <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>
              Create Record
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleGetRecords}
            disabled={loading}
          >
            <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>
              Get Records
            </Text>
          </TouchableOpacity>
        </View>

        {result && (
          <View
            style={[
              styles.resultContainer,
              {
                backgroundColor: result.success
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                borderColor: result.success ? '#22c55e' : '#ef4444',
              },
            ]}
          >
            <View style={styles.resultHeader}>
              {result.success ? (
                <CheckCircle size={24} color="#22c55e" />
              ) : (
                <XCircle size={24} color="#ef4444" />
              )}
              <Text
                style={[
                  styles.resultTitle,
                  { color: result.success ? '#22c55e' : '#ef4444' },
                ]}
              >
                {result.success ? 'Success' : 'Error'}
              </Text>
            </View>

            <Text style={[styles.resultMessage, { color: colors.text }]}>
              {result.message}
            </Text>

            {result.recordId && (
              <Text style={[styles.resultDetail, { color: colors.textSecondary }]}>
                Record ID: {result.recordId}
              </Text>
            )}

            {result.recordCount !== undefined && (
              <Text style={[styles.resultDetail, { color: colors.textSecondary }]}>
                Total Records: {result.recordCount}
              </Text>
            )}
          </View>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            What this test does:
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Creates a test document in Firestore{'\n'}
            • Retrieves recent test documents{'\n'}
            • Verifies read/write permissions{'\n'}
            • Confirms database connectivity
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  resultMessage: {
    fontSize: 16,
    marginBottom: 8,
  },
  resultDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
