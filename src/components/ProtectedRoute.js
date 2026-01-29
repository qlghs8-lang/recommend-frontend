import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem("token");

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // 토큰 없으면 바로 컷
    if (!token) {
      setChecking(false);
      setAllowed(false);
      return;
    }

    // 일반 보호 라우트면 바로 통과
    if (!requireAdmin) {
      setChecking(false);
      setAllowed(true);
      return;
    }

    // ADMIN 체크 필요
    const checkAdmin = async () => {
      try {
        const res = await axiosInstance.get("/user/me");
        const role = res?.data?.role;

        // role 값이 "ADMIN" 이거나 "ROLE_ADMIN" 둘 다 허용
        const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";

        setAllowed(isAdmin);
      } catch (e) {
        // 토큰이 유효하지 않거나 권한 문제면 로그아웃 처리
        console.error("admin check failed:", e);
        localStorage.removeItem("token");
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [token, requireAdmin]);

  if (checking) {
    return (
      <div style={{ padding: 24, color: "#fff", background: "#0b0b0b", minHeight: "100vh" }}>
        권한 확인중...
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  // admin 필요 라우트에서 admin 아니면 home으로
  if (requireAdmin && !allowed) return <Navigate to="/home" replace />;

  return children;
}

export default ProtectedRoute;
