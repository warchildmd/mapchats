import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function ProfileRedirect() {
  const session = await auth()
  if (!session) redirect('/login')
  redirect(`/profile/${(session.user as any).username}`)
}
