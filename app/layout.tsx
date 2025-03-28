import type { Metadata } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "정보처리산업기사 기출",
  description: "정보처리산업기사에 ctl을 쌈 싸서 드셔보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.5, maximum-scale=1.0, user-scalable=yes" />
      </head>
      <body
        className={`antialiased`}
      >
        {children}
        <div className="text-center">문제 저작권은 시나공에서 제공되었습니다.</div>
        <div className="text-center">https://www.sinagong.co.kr/pds/001002001/past-exams</div>
        <div className="text-center">각종 문의/오류 제보 : hyw0206s@naver.com</div>
      </body>
    </html>
  );
}
