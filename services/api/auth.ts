import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'customer' | 'provider';
}

export interface SignupResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requiresVerification?: boolean;
}

export interface VerifyCodeRequest {
  contact: string;
  code: string;
  type: 'email' | 'phone';
}

export interface VerifyCodeResponse {
  success: boolean;
  error?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockUser: User = {
    id: 'user_' + Date.now(),
    email: request.email,
    name: 'John Smith',
    phone: '+1 (555) 123-4567',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    verified: true,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    user: mockUser,
    token: 'mock_jwt_token_' + Date.now(),
  };
}

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const mockUser: User = {
    id: 'user_' + Date.now(),
    email: request.email,
    name: request.name,
    phone: request.phone,
    role: request.role,
    verified: false,
    kycStatus: request.role === 'provider' ? 'pending' : undefined,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    user: mockUser,
    token: 'mock_jwt_token_' + Date.now(),
    requiresVerification: true,
  };
}

export async function verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (request.code === '123456') {
    return { success: true };
  }
  
  return { success: false, error: 'Invalid verification code' };
}

export async function resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true };
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    token: 'mock_jwt_token_' + Date.now(),
  };
}

export async function resendVerificationCode(contact: string, type: 'email' | 'phone'): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return { success: true };
}
