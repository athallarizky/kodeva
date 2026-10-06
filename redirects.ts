import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // sprint-3: blog pindah dari /posts → /blog (jalan lama tetap sampai)
  const postsToBlog = {
    source: '/posts/:path*',
    destination: '/blog/:path*',
    permanent: true,
  }
  const postsRoot = {
    source: '/posts',
    destination: '/blog',
    permanent: true,
  }

  return [internetExplorerRedirect, postsRoot, postsToBlog]
}
