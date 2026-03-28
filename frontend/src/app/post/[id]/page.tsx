import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import PostDetailClient from './PostDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'

async function fetchPost(id: string) {
  const res = await fetch(`${API_BASE}/api/posts/${id}`, { next: { revalidate: 30 } })
  if (!res.ok) return null
  return res.json()
}

async function fetchComments(id: string) {
  const res = await fetch(`${API_BASE}/api/posts/${id}/comments`, {
    next: { revalidate: 10 },
  })
  if (!res.ok) return []
  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await fetchPost(id)
  if (!post) return { title: 'Post not found' }

  const cat = post.category.charAt(0) + post.category.slice(1).toLowerCase()
  return {
    title: post.title,
    description: `${cat} · ${post.content.slice(0, 140)}`,
    openGraph: {
      title: post.title,
      description: post.content.slice(0, 200),
      images: post.imageUrls[0]
        ? [{ url: `${process.env.NEXT_PUBLIC_API_URL}${post.imageUrls[0]}` }]
        : [],
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const [post, comments, session] = await Promise.all([
    fetchPost(id),
    fetchComments(id),
    auth(),
  ])

  if (!post) notFound()

  return (
    <PostDetailClient
      post={post}
      initialComments={comments}
      session={session}
    />
  )
}
