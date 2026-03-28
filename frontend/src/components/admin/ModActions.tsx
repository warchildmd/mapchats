'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Shield, Ban, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type Role = 'USER' | 'MODERATOR' | 'ADMIN'

interface ModActionsProps {
  username: string
  currentRole: Role
  currentBanned: boolean
}

const ROLE_LABELS: Record<Role, string> = {
  USER: 'User',
  MODERATOR: 'Moderator',
  ADMIN: 'Admin',
}

const ROLE_COLORS: Record<Role, string> = {
  USER: 'text-on-surface-variant',
  MODERATOR: 'text-tertiary',
  ADMIN: 'text-secondary',
}

export default function ModActions({ username, currentRole, currentBanned }: ModActionsProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [roleOpen, setRoleOpen] = useState(false)

  const token = session?.user.accessToken ?? ''

  const roleMutation = useMutation({
    mutationFn: (role: Role) => api.setUserRole(username, role, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] })
      setRoleOpen(false)
    },
  })

  const banMutation = useMutation({
    mutationFn: (banned: boolean) => api.banUser(username, banned, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', username] }),
  })

  return (
    <div className="flex items-center gap-2 mt-3">
      {/* Role selector */}
      <div className="relative">
        <button
          onClick={() => setRoleOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-high text-xs font-medium font-body text-on-surface transition-colors"
        >
          <Shield className={cn('w-3.5 h-3.5', ROLE_COLORS[currentRole])} />
          <span>Set role</span>
          <ChevronDown className="w-3 h-3 text-on-surface-variant" />
        </button>

        {roleOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-surface-highest rounded-2xl shadow-xl border border-surface-high overflow-hidden min-w-[130px]">
            {(['USER', 'MODERATOR', 'ADMIN'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => roleMutation.mutate(role)}
                disabled={role === currentRole || roleMutation.isPending}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-xs font-body transition-colors',
                  role === currentRole
                    ? 'text-on-surface-variant cursor-default'
                    : 'hover:bg-surface-high text-on-surface',
                  ROLE_COLORS[role]
                )}
              >
                {ROLE_LABELS[role]}
                {role === currentRole && ' ✓'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ban / Unban */}
      <button
        onClick={() => banMutation.mutate(!currentBanned)}
        disabled={banMutation.isPending}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-body transition-colors',
          currentBanned
            ? 'bg-primary/10 text-primary hover:bg-primary/20'
            : 'bg-error/10 text-error hover:bg-error/20'
        )}
      >
        <Ban className="w-3.5 h-3.5" />
        {currentBanned ? 'Unban' : 'Ban'}
      </button>
    </div>
  )
}
