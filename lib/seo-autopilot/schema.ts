import { z } from 'zod'

export const publishPayloadSchema = z.object({
  siteId: z.string().uuid(),
  postId: z.string().uuid(),
  slug: z.string().min(1),
  locale: z.string().min(1),
  title: z.string().min(1),
  metaDescription: z.string(),
  mdxBody: z.string(),
  heroImageUrl: z.string().url().nullable(),
  heroImageAlt: z.string().nullable(),
  schemaJsonLd: z.record(z.unknown()),
  internalLinks: z.array(
    z.object({ targetSlug: z.string(), anchorText: z.string() })
  ),
  tags: z.array(z.string()),
  author: z.object({
    name: z.string(),
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
