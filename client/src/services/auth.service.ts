import { apiRequest } from './api';
import type { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

interface ApiAuthWrapper {
  success: boolean;
  data: AuthResponse;
}

export async function guestLogin(username: string, avatarId: string): Promise<AuthResponse> {
  const res = await apiRequest<ApiAuthWrapper>('/auth/guest', {
    method: 'POST',
    body: { username, avatarId },
  });
  return res.data;
}

export async function register(
  username: string,
  email: string,
  password: string,
  avatarId = 'avatar_1'
): Promise<AuthResponse> {
  const res = await apiRequest<ApiAuthWrapper>('/auth/register', {
    method: 'POST',
    body: { username, email, password, avatarId },
  });
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest<ApiAuthWrapper>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await apiRequest<{ success: boolean; data: { user: User } }>('/auth/me', {
    auth: true,
  });
  return res.data.user;
}

export async function updateUserProfileApi(username: string, avatarId: string): Promise<AuthResponse> {
  const res = await apiRequest<ApiAuthWrapper>('/auth/profile', {
    method: 'PUT',
    body: { username, avatarId },
    auth: true,
  });
  return res.data;
}
