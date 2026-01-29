import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkEmail, checkNickname, registerUser } from "../api/userApi";
import axiosInstance from "../api/axiosInstance";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = sessionStorage.getItem("termsAgreements");
    if (!t) navigate("/terms", { replace: true });
  }, [navigate]);

  /* ================= 상태 ================= */
  const [email, setEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [nickname, setNickname] = useState("");
  const [nicknameMsg, setNicknameMsg] = useState("");
  const [nicknameChecked, setNicknameChecked] = useState(false);

  // 선택 입력
  const [realName, setRealName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");

  // 휴대폰 인증
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showOptional, setShowOptional] = useState(true);

  /* ================= 유효성 ================= */
  const isValidEmail = (v) => /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(v);
  const isValidPassword = (pw) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);
  const isValidNickname = (v) => /^[가-힣a-zA-Z0-9]{2,10}$/.test(v);

  const clearError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ================= 이메일 ================= */
  const handleCheckEmail = async () => {
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
    setEmailMsg("");

    if (!email) {
      setFieldErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }));
      return;
    }
    if (!isValidEmail(email)) {
      setFieldErrors((prev) => ({ ...prev, email: "이메일 형식이 올바르지 않습니다." }));
      return;
    }

    try {
      const res = await checkEmail(email);
      if (res === "OK") {
        setEmailMsg("사용 가능한 이메일입니다.");
        setEmailChecked(true);
      } else {
        setEmailMsg("이미 사용 중인 이메일입니다.");
        setEmailChecked(false);
      }
    } catch (e) {
      setEmailMsg("중복확인 중 오류가 발생했습니다.");
      setEmailChecked(false);
    }
  };

  /* ================= 닉네임 ================= */
  const handleCheckNickname = async () => {
    setFieldErrors((prev) => ({ ...prev, nickname: undefined }));
    setNicknameMsg("");

    if (!nickname) {
      setFieldErrors((prev) => ({ ...prev, nickname: "닉네임을 입력해주세요." }));
      return;
    }
    if (!isValidNickname(nickname)) {
      setFieldErrors((prev) => ({
        ...prev,
        nickname: "닉네임은 2~10자의 한글, 영문, 숫자만 가능합니다.",
      }));
      return;
    }

    try {
      const res = await checkNickname(nickname);
      if (res === "OK") {
        setNicknameMsg("사용 가능한 닉네임입니다.");
        setNicknameChecked(true);
      } else if (res === "BLACKLIST") {
        setNicknameMsg("사용할 수 없는 닉네임입니다.");
        setNicknameChecked(false);
      } else {
        setNicknameMsg("이미 사용 중인 닉네임입니다.");
        setNicknameChecked(false);
      }
    } catch (e) {
      setNicknameMsg("중복확인 중 오류가 발생했습니다.");
      setNicknameChecked(false);
    }
  };

  /* ================= 휴대폰 인증 (B안: /public/phone/**) ================= */
  const canSendPhone = useMemo(() => !!phone && phone.replaceAll("-", "").length >= 10, [phone]);
  const canVerifyPhone = useMemo(() => !!phoneCode && phoneCode.trim().length >= 4, [phoneCode]);

  const handleRequestPhone = async () => {
    if (!canSendPhone) {
      setPhoneMsg("휴대폰 번호를 올바르게 입력해주세요.");
      return;
    }
    if (phoneVerified) return;

    setPhoneMsg("");
    setPhoneSending(true);
    try {
      await axiosInstance.post("/public/phone/request", { phone: phone.trim() });
      setPhoneMsg("인증번호가 전송되었습니다.");
      setPhoneVerified(false);
    } catch (e) {
      const serverMsg = e?.response?.data;
      setPhoneMsg(typeof serverMsg === "string" ? serverMsg : "인증번호 전송 실패");
      setPhoneVerified(false);
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!canVerifyPhone) {
      setPhoneMsg("인증번호를 입력해주세요.");
      return;
    }
    if (phoneVerified) return;

    setPhoneMsg("");
    setPhoneVerifying(true);
    try {
      await axiosInstance.post("/public/phone/verify", {
        phone: phone.trim(),
        code: phoneCode.trim(),
      });
      setPhoneMsg("휴대폰 인증 완료");
      setPhoneVerified(true);
    } catch (e) {
      const serverMsg = e?.response?.data;
      setPhoneMsg(typeof serverMsg === "string" ? serverMsg : "인증번호가 올바르지 않습니다.");
      setPhoneVerified(false);
    } finally {
      setPhoneVerifying(false);
    }
  };

  /* ================= 회원가입 ================= */
  const handleRegister = async () => {
    setEmailMsg("");
    setNicknameMsg("");
    setErrorMsg("");

    const errors = {};

    if (!email) errors.email = "이메일을 입력해주세요.";
    else if (!isValidEmail(email)) errors.email = "이메일 형식이 올바르지 않습니다.";
    else if (!emailChecked) errors.email = "이메일 중복확인을 해주세요.";

    if (!nickname) errors.nickname = "닉네임을 입력해주세요.";
    else if (!nicknameChecked) errors.nickname = "닉네임 중복확인을 해주세요.";

    if (!password) errors.password = "비밀번호를 입력해주세요.";
    else if (!isValidPassword(password)) {
      errors.password = "비밀번호는 영문 + 숫자 포함 8자리 이상이어야 합니다.";
    }

    if (!passwordConfirm) errors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    else if (password !== passwordConfirm) errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const termsAgreements = JSON.parse(sessionStorage.getItem("termsAgreements") || "{}");

    setSubmitting(true);
    try {
      await registerUser({
        email,
        password,
        nickname,
        realName,
        birthDate,
        gender,
        phone,
        termsAgreements,
      });

      alert("회원가입 완료!");
      navigate("/complete", { replace: true, state: { email, nickname } });
    } catch (e) {
      const serverMsg = e?.response?.data;
      setErrorMsg(typeof serverMsg === "string" ? serverMsg : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* 단계 */}
        <div className="step-box">
          <span>① 약관동의</span>
          <span className="active">② 정보입력</span>
          <span>③ 가입완료</span>
        </div>

        <h2 className="auth-title">회원 정보 입력</h2>
        <p className="auth-subtitle">필수 정보 입력 후 회원가입을 완료하세요.</p>

        {errorMsg && <div className="auth-alert">{errorMsg}</div>}

        {/* 필수 입력 */}
        <div className="auth-section">
          <div className="section-head">
            <div className="section-title">필수 정보</div>
          </div>

          {/* 이메일 */}
          <div className="field">
            <input
              className={`input ${fieldErrors.email ? "error" : ""}`}
              placeholder="이메일"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailChecked(false);
                setEmailMsg("");
                clearError("email");
              }}
            />
            <button className="sub-btn" onClick={handleCheckEmail} type="button">
              중복확인
            </button>

            {fieldErrors.email && <p className="msg error">{fieldErrors.email}</p>}
            {emailMsg && <p className={`msg ${emailChecked ? "" : "error"}`}>{emailMsg}</p>}
          </div>

          {/* 닉네임 */}
          <div className="field">
            <input
              className={`input ${fieldErrors.nickname ? "error" : ""}`}
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameChecked(false);
                setNicknameMsg("");
                clearError("nickname");
              }}
            />
            <button className="sub-btn" onClick={handleCheckNickname} type="button">
              중복확인
            </button>

            {fieldErrors.nickname && <p className="msg error">{fieldErrors.nickname}</p>}
            {nicknameMsg && (
              <p className={`msg ${nicknameChecked ? "" : "error"}`}>{nicknameMsg}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="field">
            <input
              type="password"
              className={`input ${fieldErrors.password ? "error" : ""}`}
              placeholder="비밀번호 (영문 + 숫자 + 8자리 이상)"
              value={password}
              onChange={(e) => {
                const v = e.target.value;
                setPassword(v);

                if (!v) clearError("password");
                else if (!isValidPassword(v)) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: "비밀번호는 영문 + 숫자 포함 8자리 이상이어야 합니다.",
                  }));
                } else clearError("password");
              }}
            />
            {fieldErrors.password && <p className="msg error">{fieldErrors.password}</p>}
          </div>

          <div className="field">
            <input
              type="password"
              className={`input ${fieldErrors.passwordConfirm ? "error" : ""}`}
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => {
                const v = e.target.value;
                setPasswordConfirm(v);

                if (!v) clearError("passwordConfirm");
                else if (v !== password) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    passwordConfirm: "비밀번호가 일치하지 않습니다.",
                  }));
                } else clearError("passwordConfirm");
              }}
            />
            {fieldErrors.passwordConfirm && (
              <p className="msg error">{fieldErrors.passwordConfirm}</p>
            )}
          </div>
        </div>

        {/* 선택 입력(토글) */}
        <div className="auth-section">
          <div className="section-head">
            <div className="section-title">선택 정보</div>
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowOptional((v) => !v)}
            >
              {showOptional ? "접기" : "펼치기"}
            </button>
          </div>

          {showOptional && (
            <>
              <div className="field">
                <input
                  className="input"
                  placeholder="이름"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                />
              </div>

              <div className="field">
                <input
                  className="input"
                  placeholder="생년월일 (YYYY-MM-DD)"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="gender-box">
                <label className={`radio ${gender === "M" ? "on" : ""}`}>
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === "M"}
                    onChange={() => setGender("M")}
                  />
                  <span>남성</span>
                </label>
                <label className={`radio ${gender === "F" ? "on" : ""}`}>
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === "F"}
                    onChange={() => setGender("F")}
                  />
                  <span>여성</span>
                </label>
              </div>

              <div className="field">
                <input
                  className="input"
                  placeholder="휴대폰 번호"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneVerified(false);
                    setPhoneMsg("");
                  }}
                />
                <button
                  className="sub-btn"
                  type="button"
                  onClick={handleRequestPhone}
                  disabled={phoneSending || phoneVerified}
                  title={phoneVerified ? "이미 인증 완료된 번호입니다." : ""}
                >
                  {phoneVerified ? "인증완료" : phoneSending ? "전송중..." : "인증번호 전송"}
                </button>
              </div>

              <div className="field">
                <input
                  className="input"
                  placeholder="인증번호 입력"
                  value={phoneCode}
                  onChange={(e) => {
                    setPhoneCode(e.target.value);
                    setPhoneMsg("");
                  }}
                />
                <button
                  className="sub-btn"
                  type="button"
                  onClick={handleVerifyPhone}
                  disabled={phoneVerifying || phoneVerified}
                  title={phoneVerified ? "이미 인증 완료되었습니다." : ""}
                >
                  {phoneVerified ? "인증완료" : phoneVerifying ? "확인중..." : "인증확인"}
                </button>

                {phoneMsg && (
                  <p className={`msg ${phoneVerified ? "" : "error"}`}>{phoneMsg}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* 가입 버튼 */}
        <button className="main-btn" onClick={handleRegister} type="button" disabled={submitting}>
          {submitting ? "처리중..." : "회원가입 완료"}
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
