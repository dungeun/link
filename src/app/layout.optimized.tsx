import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// 동적 임포트로 초기 번들 크기 감소
const Providers = dynamic(() => import('@/contexts/Providers'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Revu Platform',
  description: '인플루언서 마케팅 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}