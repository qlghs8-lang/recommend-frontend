import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ui.css";
import "./MainPage.css";

function MainPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <div className="ui-page main-page">
      <div className="ui-shell">
        <div className="ui-brand">🎬 Recommend</div>

        <div className="ui-card">
          <h1 className="ui-title">영화 · 도서 추천 개인 프로젝트</h1>
          <p className="ui-desc">
            개인화 추천(For You)
          </p>

          <div className="main-actions">
            {token ? (
              <button className="ui-btn ui-btn--primary" onClick={() => navigate("/home")}>
                홈으로 이동
              </button>
            ) : (
              <>
                <button className="ui-btn ui-btn--primary" onClick={() => navigate("/login")}>
                  로그인
                </button>
                <button className="ui-btn ui-btn--ghost" onClick={() => navigate("/terms")}>
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
