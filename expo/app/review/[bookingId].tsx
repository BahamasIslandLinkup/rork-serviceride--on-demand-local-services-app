import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Star, X, Image as ImageIcon, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

export default function RateAndReviewScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleStarPress = (value: number) => {
    setRating(value);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to add photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMedia(prev => [
        ...prev,
        {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
        },
      ]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Review Required', 'Please write at least 10 characters in your review');
      return;
    }

    setSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Thank You!',
        'Your review has been submitted successfully',
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (value: number) => {
    switch (value) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Rate & Review',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          presentation: 'modal',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>How was your experience?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your feedback helps us improve our services
          </Text>

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(value => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleStarPress(value)}
                  style={styles.starButton}
                  activeOpacity={0.7}
                >
                  <Star
                    size={48}
                    color={value <= rating ? colors.secondary : colors.border}
                    fill={value <= rating ? colors.secondary : 'transparent'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text
              style={[
                styles.ratingLabel,
                { color: rating > 0 ? colors.primary : colors.textSecondary },
              ]}
            >
              {getRatingLabel(rating)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Write a Review</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Share your experience with this service..."
            placeholderTextColor={colors.textLight}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {comment.length}/500
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Photos or Videos</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Optional - Help others by showing your experience
          </Text>

          <View style={styles.mediaGrid}>
            {media.map((item, index) => (
              <View key={index} style={[styles.mediaItem, { backgroundColor: colors.background }]}>
                <View style={styles.mediaPreview}>
                  {item.type === 'video' ? (
                    <Video size={32} color={colors.textLight} />
                  ) : (
                    <ImageIcon size={32} color={colors.textLight} />
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.removeMediaButton, { backgroundColor: colors.error }]}
                  onPress={() => handleRemoveMedia(index)}
                >
                  <X size={16} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ))}

            {media.length < 5 && (
              <TouchableOpacity
                style={[styles.addMediaButton, { borderColor: colors.border }]}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <ImageIcon size={32} color={colors.textLight} />
                <Text style={[styles.addMediaText, { color: colors.textSecondary }]}>
                  Add Media
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.tipCard, { backgroundColor: `${colors.primary}10` }]}>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            💡 Tip: Detailed reviews with photos help other customers make better decisions
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { opacity: rating === 0 || comment.trim().length < 10 || submitting ? 0.5 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || comment.trim().length < 10 || submitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
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
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginBottom: 32,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    fontWeight: '500' as const,
    minHeight: 140,
  },
  charCount: {
    fontSize: 13,
    fontWeight: '500' as const,
    textAlign: 'right',
    marginTop: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  mediaPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButton: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addMediaText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
