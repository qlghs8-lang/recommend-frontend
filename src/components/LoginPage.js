import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import axiosInstance from "../api/axiosInstance";
import "../styles/ui.css";
import "./LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ AuthWatcher 등에서 전달한 메시지 표시 (세션 만료/권한 없음 등)
  useEffect(() => {
    const m = location.state?.msg;
    if (m) setMsg(m);
  }, [location.state]);

  // ✅ 이미 로그인된 상태면 role 확인 후 이동
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const redirectByRole = async () => {
      try {
        const res = await axiosInstance.get("/user/me");
        const role = res?.data?.role || "";

        // ✅ role 캐시(ProtectedRoute / 빠른 분기용)
        localStorage.setItem("role", role);

        const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";
        navigate(isAdmin ? "/admin" : "/home", { replace: true });
      } catch (e) {
        // 토큰이 깨졌거나 만료된 경우(axiosInstance에서 토큰 지울 수 있음)
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    };

    redirectByRole();
  }, [navigate]);

  const handleLogin = async () => {
    try {
      setMsg("");

      const res = await loginApi(email, password);

      // token / nickname 저장
      localStorage.setItem("token", res.token);
      localStorage.setItem("nickname", res.nickname);

      // ✅ 로그인 직후 role 확인 후 이동 + role 캐시
      const me = await axiosInstance.get("/user/me");
      const role = me?.data?.role || "";
      localStorage.setItem("role", role);

      const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";
      navigate(isAdmin ? "/admin" : "/home", { replace: true });
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setMsg("로그인 실패. 이메일 혹은 비밀번호를 확인하세요.");
    }
  };

  return (
    <div className="ui-page login-page">
      <div className="ui-shell">
        <div className="ui-brand">🎬 Recommend</div>

        <div className="ui-card">
          <h2 className="ui-title">로그인</h2>
          <p className="ui-desc">계정으로 로그인하면 추천 홈으로 이동합니다.</p>

          <div className="ui-field">
            <div className="ui-label">이메일</div>
            <input
              className="ui-input"
              placeholder="test@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="ui-field">
            <div className="ui-label">비밀번호</div>
            <input
              className="ui-input"
              placeholder="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
          </div>

          <div className="login-actions">
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={handleLogin}
              disabled={!email || !password}
              title={!email || !password ? "이메일/비밀번호를 입력하세요" : ""}
            >
              로그인
            </button>

            <button className="ui-btn ui-btn--ghost" onClick={() => navigate("/terms")}>
              회원가입
            </button>

            <button className="ui-btn ui-btn--soft" onClick={() => navigate("/")}>
              메인으로
            </button>
          </div>

          {msg && <p className="ui-msg ui-msg--error">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
