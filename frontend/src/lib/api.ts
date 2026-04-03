export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export type ApiError = { error: string }

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { headers, ...rest })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((body as ApiError).error || res.statusText)
  }

  return res.json() as Promise<T>
}

// Typed helpers
export const api = {
  // Posts
  getMapPins: (
    bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number },
    token?: string,
    category?: 'ALERT' | 'DISCUSSION' | 'EVENT'
  ) => {
    const params = new URLSearchParams({
      sw_lat: String(bounds.sw_lat),
      sw_lng: String(bounds.sw_lng),
      ne_lat: String(bounds.ne_lat),
      ne_lng: String(bounds.ne_lng),
    })
    if (category) params.set('category', category)
    return apiFetch<MapPin[]>(`/api/posts/map?${params}`, { token })
  },

  getPost: (id: string, token?: string) => apiFetch<Post>(`/api/posts/${id}`, { token }),

  createPost: (data: CreatePostBody, token: string) =>
    apiFetch<Post>('/api/posts', { method: 'POST', body: JSON.stringify(data), token }),

  votePost: (id: string, value: 1 | -1, token: string) =>
    apiFetch<VoteResult>(`/api/posts/${id}/vote`, { method: 'POST', body: JSON.stringify({ value }), token }),

  deletePost: (id: string, token: string) =>
    apiFetch<{ ok: boolean }>(`/api/posts/${id}`, { method: 'DELETE', token }),

  // Comments
  getComments: (postId: string, token?: string) =>
    apiFetch<Comment[]>(`/api/posts/${postId}/comments`, { token }),

  createComment: (postId: string, content: string, token: string) =>
    apiFetch<Comment>(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }), token }),

  replyToComment: (commentId: string, content: string, token: string) =>
    apiFetch<Comment>(`/api/comments/${commentId}/replies`, { method: 'POST', body: JSON.stringify({ content }), token }),

  voteComment: (commentId: string, value: 1 | -1, token: string) =>
    apiFetch<VoteResult>(`/api/comments/${commentId}/vote`, { method: 'POST', body: JSON.stringify({ value }), token }),

  // Users
  getMe: (token: string) => apiFetch<UserProfile>('/api/users/me', { token }),
  getUser: (username: string) => apiFetch<UserProfile>(`/api/users/${username}`),
  updateMe: (data: { displayName?: string; avatar?: string }, token: string) =>
    apiFetch<User>('/api/users/me', { method: 'PATCH', body: JSON.stringify(data), token }),

  // Moderation
  deleteComment: (commentId: string, token: string) =>
    apiFetch<{ ok: boolean }>(`/api/comments/${commentId}`, { method: 'DELETE', token }),

  setUserRole: (username: string, role: 'USER' | 'MODERATOR' | 'ADMIN', token: string) =>
    apiFetch<User>(`/api/users/${username}/role`, { method: 'PATCH', body: JSON.stringify({ role }), token }),

  banUser: (username: string, banned: boolean, token: string) =>
    apiFetch<User>(`/api/users/${username}/ban`, { method: 'PATCH', body: JSON.stringify({ banned }), token }),

  // Auth
  register: (data: { email: string; username: string; password: string; displayName: string }) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
}

// Types
export interface MapPin {
  id: string
  category: 'ALERT' | 'DISCUSSION' | 'EVENT'
  title: string
  lat: number
  lng: number
  expiresAt: string
  createdAt: string
  upvotes: number
  downvotes: number
  commentCount: number
  engagementScore: number
  author: { id: string; username: string; displayName: string; avatar: string | null }
}

export interface Post extends MapPin {
  content: string
  imageUrls: string[]
  locationName: string | null
  startTime: string | null
  userVote: 1 | -1 | null
}

export interface Comment {
  id: string
  postId: string
  parentCommentId: string | null
  content: string
  createdAt: string
  author: { id: string; username: string; displayName: string; avatar: string | null }
  upvotes: number
  downvotes: number
  replyCount: number
  userVote: 1 | -1 | null
}

export interface User {
  id: string
  username: string
  displayName: string
  avatar: string | null
  karma: number
  level: number
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  banned: boolean
  createdAt: string
}

export interface UserProfile extends User {
  badges: Badge[]
  reputation: {
    level: number
    rank: string
    karma: number
    percentToNextLevel: number
    nextLevelThreshold: number
  }
  recentPosts?: Post[]
  recentComments?: Comment[]
}

export interface Badge {
  id: string
  name: string
  icon: string
  awardedAt: string
}

export interface VoteResult {
  upvotes: number
  downvotes: number
  userVote: 1 | -1 | null
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface CreatePostBody {
  category: 'ALERT' | 'DISCUSSION' | 'EVENT'
  title: string
  content: string
  imageUrls: string[]
  lat: number
  lng: number
  locationName?: string
  userLat: number
  userLng: number
  startTime?: string
}
