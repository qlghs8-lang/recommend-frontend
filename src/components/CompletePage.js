import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ui.css";
import "./CompletePage.css";

function CompletePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const nickname = location.state?.nickname || "";
  const email = location.state?.email || "";

  useEffect(() => {
    sessionStorage.removeItem("termsAgreements");
  }, []);

  return (
    <div className="ui-page">
      <div className="ui-shell">
        <div className="ui-card">
          <div className="step-box">
            <span>① 약관동의</span>
            <span>② 정보입력</span>
            <span className="active">③ 가입완료</span>
          </div>

          <h2 className="ui-title">가입 완료 🎉</h2>
          <p className="ui-desc">
            {nickname ? `${nickname}님, 환영합니다.` : "환영합니다."}
          </p>

          <div className="complete-summary">
            {email && (
              <div className="row">
                <span className="key">이메일</span>
                <span className="val">{email}</span>
              </div>
            )}
            {nickname && (
              <div className="row">
                <span className="key">닉네임</span>
                <span className="val">{nickname}</span>
              </div>
            )}
          </div>

          <button
            className="ui-btn ui-btn--primary"
            onClick={() => navigate("/login", { replace: true })}
          >
            로그인 하러가기
          </button>

          <button
            className="ui-btn ui-btn--ghost"
            onClick={() => navigate("/", { replace: true })}
          >
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletePage;
