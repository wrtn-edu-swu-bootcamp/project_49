"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Moon, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #e3f2fd 0%, #fff8e1 100%)",
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "48px 40px",
        maxWidth: "400px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        position: "relative",
      }}>
        <button
          onClick={handleSkip}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          title="로그인하지 않고 계속하기"
        >
          <X size={20} color="#64748b" />
        </button>

        <div style={{
          width: "64px",
          height: "64px",
          margin: "0 auto 24px",
          background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Moon size={32} color="white" />
        </div>
        
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
          Sleep Debt
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "32px" }}>
          로그인하면 모든 기기에서 데이터를 동기화할 수 있어요
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.2s ease",
            marginBottom: "16px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "로그인 중..." : "Google로 로그인"}
        </button>

        <button
          onClick={handleSkip}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            color: "#64748b",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          로그인하지 않고 계속하기
        </button>

        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "24px", lineHeight: "1.6" }}>
          💡 로그인 없이도 모든 기능을 사용할 수 있어요<br/>
          데이터는 브라우저에 안전하게 저장됩니다
        </p>
      </div>
    </div>
  );
}
