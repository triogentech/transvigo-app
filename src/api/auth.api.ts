import { api } from './client';
import type {
  ChangePasswordBody,
  LoginRequest,
  LoginResponse,
  TokenPair,
} from '@/types/api.types';

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', body);
  return res.data;
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  const res = await api.post<TokenPair>('/auth/refresh', { refreshToken });
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function changePassword(body: ChangePasswordBody): Promise<void> {
  await api.post('/auth/change-password', body);
}
