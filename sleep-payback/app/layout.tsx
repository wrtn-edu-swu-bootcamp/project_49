import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Sleep-Payback | 수면 상환 매니저",
  description: "AI 기반 수면 부채 관리 서비스 - 오늘의 컨디션을 회복하세요",
  keywords: ["수면", "수면 부채", "수면 관리", "컨디션 회복", "AI 헬스케어"],
  authors: [{ name: "Sleep-Payback Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
