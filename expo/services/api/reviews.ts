import type { Review } from '@/types';

export interface SubmitReviewRequest {
  bookingId: string;
  providerId: string;
  rating: number;
  comment: string;
  mediaUris?: string[];
}

export interface ListReviewsRequest {
  providerId: string;
  page?: number;
  limit?: number;
}

export async function submitReview(request: SubmitReviewRequest): Promise<{ success: boolean; review?: Review; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const review: Review = {
    id: 'review_' + Date.now(),
    userName: 'John Smith',
    userImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    rating: request.rating,
    comment: request.comment,
    date: new Date().toISOString(),
    videoUrl: request.mediaUris?.find(uri => uri.includes('video')),
  };
  
  return { success: true, review };
}

export async function listReviews(request: ListReviewsRequest): Promise<Review[]> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [
    {
      id: '1',
      userName: 'John Smith',
      userImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      rating: 5,
      comment: 'Excellent service! Very professional and completed the job quickly.',
      date: '2025-09-28',
    },
    {
      id: '2',
      userName: 'Lisa Anderson',
      userImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      rating: 5,
      comment: 'Great attention to detail. Will definitely book again!',
      date: '2025-09-15',
    },
  ];
}

export async function getProviderRating(providerId: string): Promise<{ rating: number; reviewCount: number }> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return { rating: 4.9, reviewCount: 127 };
}
