import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ui.css";
import "./TermsPage.css";

function TermsPage() {
  const navigate = useNavigate();

  const TERMS = useMemo(
    () => [
      {
        key: "service",
        title: "[필수] 이용약관 동의",
        required: true,
        content:
          "이용약관 내용(요약/전체)\n\n- 서비스 이용 규칙\n- 금지행위\n- 계정/보안\n- 책임 범위",
      },
      {
        key: "privacy",
        title: "[필수] 개인정보 처리방침 동의",
        required: true,
        content:
          "개인정보 처리방침 내용(요약/전체)\n\n- 수집 항목\n- 이용 목적\n- 보관 기간\n- 제3자 제공 여부",
      },
      {
        key: "age14",
        title: "[필수] 만 14세 이상입니다",
        required: true,
        content: "만 14세 이상만 가입 가능합니다.",
      },
      {
        key: "marketing",
        title: "[선택] 마케팅 정보 수신 동의",
        required: false,
        content: "이벤트/혜택 안내 수신 동의(선택)\n\n- 언제든 철회 가능",
      },
    ],
    []
  );

  const [checked, setChecked] = useState(() => {
    const init = {};
    TERMS.forEach((t) => (init[t.key] = false));
    return init;
  });

  const [openKey, setOpenKey] = useState(TERMS[0]?.key);

  const requiredKeys = TERMS.filter((t) => t.required).map((t) => t.key);
  const allChecked = TERMS.every((t) => checked[t.key]);
  const requiredDone = requiredKeys.every((k) => checked[k]);

  const toggleAll = (value) => {
    const next = {};
    TERMS.forEach((t) => (next[t.key] = value));
    setChecked(next);
  };

  const toggleOne = (key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    if (!requiredDone) return;

    const payload = {
      service: !!checked.service,
      privacy: !!checked.privacy,
      age14: !!checked.age14,
      marketing: !!checked.marketing,
    };

    sessionStorage.setItem("termsAgreements", JSON.stringify(payload));
    navigate("/register");
  };

  return (
    <div className="ui-page auth-terms">
      <div className="ui-shell">
        <div className="ui-brand">🎬 Recommend</div>

        <div className="ui-card">
          <div className="ui-steps">
            <span className="active">① 약관동의</span>
            <span>② 정보입력</span>
            <span>③ 가입완료</span>
          </div>

          <h2 className="ui-title">약관동의</h2>
          <p className="ui-desc">필수 약관에 동의해야 가입을 진행할 수 있습니다.</p>

          <div className="ui-box auth-all">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              <span>전체 동의</span>
            </label>
          </div>

          <div className="auth-terms-list">
            {TERMS.map((t) => {
              const isOpen = openKey === t.key;
              return (
                <div key={t.key} className={`auth-term ${isOpen ? "open" : ""}`}>
                  <div className="auth-term-head">
                    <label className="auth-check">
                      <input
                        type="checkbox"
                        checked={checked[t.key]}
                        onChange={() => toggleOne(t.key)}
                      />
                      <span className={`auth-term-title ${t.required ? "req" : "opt"}`}>
                        {t.title}
                      </span>
                    </label>

                    <button
                      type="button"
                      className="auth-view-btn"
                      onClick={() => setOpenKey(isOpen ? null : t.key)}
                    >
                      {isOpen ? "닫기" : "보기"}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="auth-term-body">
                      <pre className="auth-term-content">{t.content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="auth-actions">
            <button
              type="button"
              className={`ui-btn ui-btn--primary ${requiredDone ? "" : "auth-disabled"}`}
              onClick={handleNext}
              disabled={!requiredDone}
            >
              다음
            </button>

            {!requiredDone && (
              <p className="ui-msg ui-msg--error">필수 약관에 동의해야 다음으로 진행됩니다.</p>
            )}

            <button className="ui-btn ui-btn--ghost" onClick={() => navigate("/login")}>
              로그인으로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
