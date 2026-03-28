import { PrismaClient } from '@prisma/client'

const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 5000, 15000, 50000]

export function levelForKarma(karma: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (karma >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  return Math.min(level, LEVEL_THRESHOLDS.length)
}

export async function recalcKarma(prisma: PrismaClient, userId: string): Promise<void> {
  const agg = await prisma.vote.aggregate({
    where: {
      OR: [
        { post: { authorId: userId } },
        { comment: { authorId: userId } },
      ],
    },
    _sum: { value: true },
  })

  const karma = Math.max(0, agg._sum.value ?? 0)
  const level = levelForKarma(karma)

  await prisma.user.update({
    where: { id: userId },
    data: { karma, level },
  })
}
