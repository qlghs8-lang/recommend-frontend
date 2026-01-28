// src/components/AuthWatcher.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const msg = e?.detail?.message || "로그인이 필요합니다.";
      navigate("/login", { replace: true, state: { msg } });
    };

    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [navigate]);

  return null;
}
