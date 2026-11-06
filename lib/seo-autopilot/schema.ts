import { z } from 'zod'

export const publishPayloadSchema = z.object({
  siteId: z.string().uuid(),
  postId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  locale: z.literal('de'),
  title: z.string().trim().min(1),
  metaDescription: z.string(),
  mdxBody: z.string().trim().min(1),
  heroImageUrl: z.string().url().nullable(),
  heroImageAlt: z.string().nullable(),
  // Public JSON-LD is built locally. Ignore incompatible upstream schema shapes.
  schemaJsonLd: z.unknown().transform((value): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}),
  internalLinks: z.array(
    z.object({ targetSlug: z.string(), anchorText: z.string() })
  ),
  tags: z.array(z.string()),
  author: z.object({
    name: z.string().trim().min(1),
    jobTitle: z.string().nullable(),
    linkedinUrl: z.string().url().nullable().optional(),
    bio: z.string().nullable(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isRefresh: z.boolean(),
  geoScore: z.number().int().min(0).max(100).optional(),
})

export type PublishPayload = z.infer<typeof publishPayloadSchema>
