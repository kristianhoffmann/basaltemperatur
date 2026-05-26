import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BlogPostRedirectPage({ params }: Props) {
  const { slug } = await params
  redirect(`/de/blog/${slug}`)
}
