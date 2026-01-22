"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  // 환경 변수가 없으면 그냥 children만 반환 (로그인 비활성화)
  if (!process.env.NEXT_PUBLIC_ENABLE_AUTH) {
    return <>{children}</>;
  }
  
  return <SessionProvider>{children}</SessionProvider>;
}
