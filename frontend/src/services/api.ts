import axiosInstance from './axios';

export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  follower_count?: number;
  following_count?: number;
  topic_count?: number;
  reply_count?: number;
  is_following?: boolean;
  total_likes?: number;
  topics?: Topic[];
  replies?: Reply[];
  is_online?: boolean;
  last_seen?: string;
}

export interface Topic {
  id: number;
  title: string;
  description: string;
  user: User;
  created: string;
  updated?: string;
  replies?: Reply[];
  reply_count?: number;
  like_count: number;
  user_has_liked: boolean;
  user_has_bookmarked: boolean;
  shared_count: number;
  user_has_shared: boolean;
}

export interface Reply {
  id: number;
  topic: number;
  parent?: number | null;
  user: User;
  content: string;
  created: string;
  like_count: number;
  user_has_liked: boolean;
  user_has_bookmarked: boolean;
  shared_count: number;
  user_has_shared: boolean;
  children?: Reply[];
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

export interface BookmarkEntry {
  id: number;
  content_type: 'topic' | 'reply';
  content: Topic;
  created: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
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

  googleLogin: (code: string) =>
    axiosInstance.post<AuthTokens>('/auth/google/', { code }),

  passwordReset: (email: string) =>
    axiosInstance.post('/auth/password/reset/', { email }, { withCredentials: false }),

  passwordResetConfirm: (data: { uid: string; token: string; new_password1: string; new_password2: string }) =>
    axiosInstance.post('/auth/password/reset/confirm/', data, { withCredentials: false }),
};

export const usersAPI = {
  getProfile: () =>
    axiosInstance.get<User>('/api/users/me/'),

  getUser: (id: number) =>
    axiosInstance.get<User>(`/api/users/${id}/`),

  getFollowing: () =>
    axiosInstance.get<{ results: User[] }>('/api/users/me/following/'),

  toggleFollow: (userId: number) =>
    axiosInstance.post<{ status: string; follower_count: number }>(`/api/users/${userId}/follow/`),

  updateProfile: (data: { username?: string; first_name?: string; last_name?: string; bio?: string; avatar?: string }) =>
    axiosInstance.patch<User>('/api/users/me/', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return axiosInstance.post<{ avatar: string }>('/api/users/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const forumAPI = {
  getTopics: (params?: { page?: number; search?: string }) =>
    axiosInstance.get<{ results: Topic[]; count: number; next: string | null }>('/api/topics/', { params }),

  getTopic: (id: number) =>
    axiosInstance.get<Topic>(`/api/topics/${id}/`),

  createTopic: (data: { title: string; description: string }) =>
    axiosInstance.post<Topic>('/api/topics/', data),

  updateTopic: (id: number, data: { title?: string; description?: string }) =>
    axiosInstance.put<Topic>(`/api/topics/${id}/`, data),

  deleteTopic: (id: number) =>
    axiosInstance.delete(`/api/topics/${id}/`),

  createReply: (topicId: number, data: { content: string; parent?: number | null }) =>
    axiosInstance.post<Reply>(`/api/topics/${topicId}/replies/`, data),

  deleteReply: (id: number) =>
    axiosInstance.delete(`/api/replies/${id}/`),

  updateReply: (id: number, data: { content: string }) =>
    axiosInstance.patch<Reply>(`/api/replies/${id}/`, data),

  likeTopic: (topicId: number) =>
    axiosInstance.post(`/api/topics/${topicId}/like/`),

  likeReply: (replyId: number) =>
    axiosInstance.post(`/api/replies/${replyId}/like/`),

  bookmarkTopic: (topicId: number) =>
    axiosInstance.post(`/api/topics/${topicId}/bookmark/`),

  bookmarkReply: (replyId: number) =>
    axiosInstance.post(`/api/replies/${replyId}/bookmark/`),

  shareTopic: (topicId: number) =>
    axiosInstance.post(`/api/topics/${topicId}/shares/`),

  shareReply: (replyId: number) =>
    axiosInstance.post(`/api/replies/${replyId}/shares/`),

  getBookmarks: (params?: { page?: number }) =>
    axiosInstance.get<{ results: BookmarkEntry[]; count: number; next: string | null }>('/api/bookmarks/', { params }),
};

export const notificationsAPI = {
  getUnreadCount: () =>
    axiosInstance.get<{ count: number }>('/api/notifications/unread-count/'),
};

export default {
  auth: authAPI,
  forum: forumAPI,
};
