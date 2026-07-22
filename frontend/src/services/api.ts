import axiosInstance from './axios';

export interface User {
  id: number;
  username: string;
}

export interface Topic {
  id: number;
  title: string;
  description: string;
  user: User;
  created: string;
  replies: Reply[];
  like_count: number;
  user_has_liked: boolean;
}

export interface Reply {
  id: number;
  topic: number;
  user: User;
  content: string;
  created: string;
  like_count: number;
  user_has_liked: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password1: string;
  password2: string;
  username?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    axiosInstance.post<AuthTokens>('/auth/login/', credentials),

  register: (data: RegisterData) =>
    axiosInstance.post('/auth/registration/', data),

  logout: () =>
    axiosInstance.post('/auth/logout/'),

  getCurrentUser: () =>
    axiosInstance.get<User>('/auth/user/'),
};

export const forumAPI = {
  getTopics: (params?: { page?: number }) =>
    axiosInstance.get<{ results: Topic[]; count: number }>('/api/topics/', { params }),

  getTopic: (id: number) =>
    axiosInstance.get<Topic>(`/api/topics/${id}/`),

  createTopic: (data: { title: string; description: string }) =>
    axiosInstance.post<Topic>('/api/topics/', data),

  updateTopic: (id: number, data: { title?: string; description?: string }) =>
    axiosInstance.put<Topic>(`/api/topics/${id}/`, data),

  deleteTopic: (id: number) =>
    axiosInstance.delete(`/api/topics/${id}/`),

  createReply: (topicId: number, data: { content: string }) =>
    axiosInstance.post<Reply>(`/api/topics/${topicId}/replies/`, data),

  deleteReply: (id: number) =>
    axiosInstance.delete(`/api/replies/${id}/`),

  likeTopic: (topicId: number) =>
    axiosInstance.post(`/api/topics/${topicId}/like/`),

  likeReply: (replyId: number) =>
    axiosInstance.post(`/api/replies/${replyId}/like/`),
};

export default {
  auth: authAPI,
  forum: forumAPI,
};
