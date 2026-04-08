import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "정보처리산업기사 기출",
  description: "정보처리산업기사 최신 기출 문제 학습 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        {/* 다크모드 플리커 방지 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('jcsangi_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <div className="text-center text-xs text-gray-400 py-4 border-t mt-8">
          문제 저작권은 시나공에서 제공되었습니다.{" "}
          <a
            href="https://www.sinagong.co.kr/pds/001002001/past-exams"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            sinagong.co.kr
          </a>
        </div>
      </body>
    </html>
  );
}
