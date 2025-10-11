import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  HelpCircle, 
  MessageCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Send,
  FileText
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I book a service?',
    answer: 'Browse services, select a provider, choose your date and time, and confirm your booking. You\'ll receive a confirmation once the provider accepts.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit cards, debit cards, Apple Pay, and Google Pay. Your payment is securely processed and held until the service is completed.',
  },
  {
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel your booking before the provider starts the service. Cancellation policies may vary by provider. Check the booking details for specific terms.',
  },
  {
    question: 'How do I become a service provider?',
    answer: 'Switch to provider mode in your profile, complete the KYC verification process, add your services, and start accepting bookings. We\'ll review your application within 24-48 hours.',
  },
  {
    question: 'What if I have an issue with a service?',
    answer: 'You can file a dispute from the booking details page. Our support team will review the case and work with both parties to reach a fair resolution.',
  },
  {
    question: 'How do provider ratings work?',
    answer: 'After each completed service, customers can rate providers from 1-5 stars and leave a review. These ratings help maintain service quality and help other customers make informed decisions.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'Yes, we use industry-standard encryption and never store your full card details. All payments are processed through secure, PCI-compliant payment processors.',
  },
  {
    question: 'How do I contact a provider?',
    answer: 'Once you book a service, you can message the provider directly through the in-app chat. You\'ll receive notifications for new messages.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleSubmitContact = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('[Support] Submitting contact form:', contactForm);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Message Sent',
        'Thank you for contacting us. Our support team will respond within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowContactForm(false);
              setContactForm({ subject: '', message: '' });
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Support] Error submitting contact form:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDispute = () => {
    router.push('/dispute/new' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Help & Support',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.quickActions, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => setShowContactForm(!showContactForm)}
          >
            <MessageCircle size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Contact Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={handleFileDispute}
          >
            <AlertCircle size={24} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              File a Dispute
            </Text>
          </TouchableOpacity>
        </View>

        {showContactForm && (
          <View style={[styles.contactForm, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Contact Support</Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="Subject"
              placeholderTextColor={colors.textSecondary}
              value={contactForm.subject}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
            />

            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="Describe your issue..."
              placeholderTextColor={colors.textSecondary}
              value={contactForm.message}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitContact}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1E1E1E" />
              ) : (
                <>
                  <Send size={20} color="#1E1E1E" />
                  <Text style={styles.submitButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Frequently Asked Questions
            </Text>
          </View>

          {FAQ_DATA.map((faq, index) => (
            <View key={index}>
              <TouchableOpacity
                style={[
                  styles.faqItem,
                  { borderBottomColor: colors.border },
                  index === FAQ_DATA.length - 1 && styles.lastFaqItem,
                ]}
                onPress={() => toggleFAQ(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {faq.question}
                </Text>
                {expandedFAQ === index ? (
                  <ChevronUp size={20} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              
              {expandedFAQ === index && (
                <View style={[styles.faqAnswer, { backgroundColor: colors.background }]}>
                  <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
          <FileText size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Need More Help?
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Our support team is available 24/7 to assist you. Response time is typically under 2 hours.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  contactForm: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  lastFaqItem: {
    borderBottomWidth: 0,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
