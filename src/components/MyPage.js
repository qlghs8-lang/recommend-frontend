import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/ui.css";
import "./MyPage.css";

function MyPage() {
  const navigate = useNavigate();
  const API_BASE = useMemo(() => "http://localhost:8080", []);

  // ✅ 장르 옵션(서버에서 동적으로)
  const [genreOptions, setGenreOptions] = useState([]); // string[]

  // 기본 정보
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // 선택 정보
  const [realName, setRealName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // "YYYY-MM-DD"
  const [gender, setGender] = useState(""); // "M" | "F" | ""
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // 휴대폰 인증 입력
  const [phoneToVerify, setPhoneToVerify] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  // 변경 폼
  const [newNickname, setNewNickname] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  // ✅ 온보딩(선호 장르) 수정
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [preferredGenres, setPreferredGenres] = useState([]); // string[]
  const [onbBusy, setOnbBusy] = useState(false);
  const [onbMsg, setOnbMsg] = useState("");

  // UI 상태
  const [message, setMessage] = useState("");
  const [loadingMe, setLoadingMe] = useState(false);
  const [busy, setBusy] = useState(false);

  // ✅ 내 정보 조회
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchMe = async () => {
      setLoadingMe(true);
      setMessage("");
      try {
        const res = await axiosInstance.get("/user/me");
        const data = res.data || {};

        const nick = data.nickname ?? data.name ?? "";
        setEmail(data.email ?? "");
        setNickname(nick);
        setCreatedAt(data.createdAt ?? "");
        setNewNickname(nick);
        setProfileImage(data.profileImageUrl ?? "");

        // ✅ 선택 정보
        setRealName(data.realName ?? "");
        setBirthDate(data.birthDate ?? "");
        setGender(data.gender ?? "");
        setPhone(data.phone ?? "");
        setPhoneVerified(!!data.phoneVerified);
        setVerifiedPhone(data.verifiedPhone ?? "");

        // 인증 UI 입력값 초기화(현재 값으로)
        setPhoneToVerify(data.phone ?? "");
        setVerifyCode("");
      } catch (e) {
        navigate("/login", { replace: true });
      } finally {
        setLoadingMe(false);
      }
    };

    fetchMe();
  }, [navigate]);

  // ✅ 온보딩(선호 장르) 조회
  useEffect(() => {
    const fetchOnboarding = async () => {
      try {
        const res = await axiosInstance.get("/user/onboarding");
        const done = !!res.data?.onboardingDone;
        const pref = Array.isArray(res.data?.preferredGenres) ? res.data.preferredGenres : [];
        setOnboardingDone(done);
        setPreferredGenres(pref);
      } catch (e) {
        // 온보딩 API 실패해도 마이페이지는 동작
      }
    };

    fetchOnboarding();
  }, []);

  // ✅ 장르 옵션 로드(동적)
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await axiosInstance.get("/contents/genres");
        const list = Array.isArray(res.data) ? res.data : [];
        setGenreOptions(list);
      } catch (e) {
        setGenreOptions([]);
      }
    };
    loadGenres();
  }, []);

  // ✅ 프로필 이미지 업로드
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosInstance.post("/user/profile-image", formData);
      const imageUrl = typeof res.data === "string" ? res.data : "";

      if (!imageUrl) {
        setMessage("이미지 업로드 응답이 올바르지 않습니다.");
        return;
      }

      setProfileImage(imageUrl);
      setMessage("프로필 이미지가 변경되었습니다.");
    } catch {
      setMessage("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  // ✅ 프로필 이미지 삭제
  const handleDeleteImage = async () => {
    setBusy(true);
    setMessage("");
    try {
      await axiosInstance.delete("/user/profile-image");
      setProfileImage("");
      setMessage("프로필 이미지가 삭제되었습니다.");
    } catch {
      setMessage("프로필 이미지 삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  // ✅ 닉네임 변경: 백엔드 기준 /user/nickname + {nickname}
  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) {
      setMessage("닉네임을 입력해주세요.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await axiosInstance.put("/user/nickname", { nickname: newNickname.trim() });

      setNickname(newNickname.trim());
      localStorage.setItem("nickname", newNickname.trim());
      setMessage("닉네임이 변경되었습니다.");
    } catch (e) {
      const serverMsg = e?.response?.data;
      setMessage(typeof serverMsg === "string" ? serverMsg : "닉네임 변경에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  // ✅ 비밀번호 변경
  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      setMessage("현재 비밀번호와 새 비밀번호를 모두 입력해주세요.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const res = await axiosInstance.put("/user/password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });

      const msg = typeof res.data === "string" ? res.data : "비밀번호가 변경되었습니다.";
      setMessage(msg);
      setCurrentPw("");
      setNewPw("");
    } catch (e) {
      const serverMsg = e?.response?.data;
      setMessage(typeof serverMsg === "string" ? serverMsg : "비밀번호 변경 실패");
    } finally {
      setBusy(false);
    }
  };

  // ✅ 선택정보 저장(/user/extra-info)
  const handleSaveExtraInfo = async () => {
    setBusy(true);
    setMessage("");
    try {
      await axiosInstance.put("/user/extra-info", {
        realName: realName || null,
        birthDate: birthDate || null,
        gender: gender || null,
        phone: phone || null,
      });

      // 최신 상태 다시 로드
      const res = await axiosInstance.get("/user/me");
      const data = res.data || {};
      setRealName(data.realName ?? "");
      setBirthDate(data.birthDate ?? "");
      setGender(data.gender ?? "");
      setPhone(data.phone ?? "");
      setPhoneVerified(!!data.phoneVerified);
      setVerifiedPhone(data.verifiedPhone ?? "");
      setPhoneToVerify(data.phone ?? "");
      setVerifyCode("");

      setMessage("추가 정보가 저장되었습니다.");
    } catch (e) {
      const serverMsg = e?.response?.data;
      setMessage(typeof serverMsg === "string" ? serverMsg : "추가 정보 저장 실패");
    } finally {
      setBusy(false);
    }
  };

  // ✅ (추가) 이미 인증된 번호면 요청/확인 버튼 비활성화
  const normalizedPhoneToVerify = (phoneToVerify || "").trim();
  const isAlreadyVerifiedSameNumber =
    !!phoneVerified && !!verifiedPhone && verifiedPhone === normalizedPhoneToVerify;

  // ✅ 휴대폰 인증 요청
  const requestPhoneVerification = async () => {
    if (!normalizedPhoneToVerify) {
      setMessage("휴대폰 번호를 입력해주세요.");
      return;
    }

    // ✅ 프론트에서도 한 번 더 차단 (UX + 실수 방지)
    if (isAlreadyVerifiedSameNumber) {
      setMessage("이미 인증된 휴대폰 번호입니다.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await axiosInstance.post("/user/phone/request", { phone: normalizedPhoneToVerify });
      setMessage("인증번호를 발송했습니다.");
    } catch (e) {
      const serverMsg = e?.response?.data;
      setMessage(typeof serverMsg === "string" ? serverMsg : "인증번호 요청 실패");
    } finally {
      setBusy(false);
    }
  };

  // ✅ 휴대폰 인증 확인
  const confirmPhoneVerification = async () => {
    if (!verifyCode.trim()) {
      setMessage("인증번호를 입력해주세요.");
      return;
    }

    // ✅ 이미 인증된 동일 번호면 확인도 막기
    if (isAlreadyVerifiedSameNumber) {
      setMessage("이미 인증된 휴대폰 번호입니다.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const res = await axiosInstance.post("/user/phone/verify", { code: verifyCode.trim() });
      const msg = typeof res.data === "string" ? res.data : "휴대폰 인증 완료";
      setMessage(msg);

      // 최신 상태 다시 로드
      const me = await axiosInstance.get("/user/me");
      const data = me.data || {};
      setPhone(data.phone ?? "");
      setPhoneVerified(!!data.phoneVerified);
      setVerifiedPhone(data.verifiedPhone ?? "");
    } catch (e) {
      const serverMsg = e?.response?.data;
      setMessage(typeof serverMsg === "string" ? serverMsg : "인증 실패");
    } finally {
      setBusy(false);
    }
  };

  // ✅ 온보딩 장르 토글
  const toggleGenre = (g) => {
    setOnbMsg("");
    setPreferredGenres((prev) => {
      const set = new Set(prev);
      if (set.has(g)) set.delete(g);
      else set.add(g);
      return Array.from(set);
    });
  };

  // ✅ 온보딩 장르 저장
  const savePreferredGenres = async () => {
    if (preferredGenres.length < 3) {
      setOnbMsg("장르는 최소 3개 이상 선택해야 합니다.");
      return;
    }

    setOnbBusy(true);
    setOnbMsg("");
    try {
      await axiosInstance.put("/user/onboarding/genres", { genres: preferredGenres });
      setOnboardingDone(true);
      setOnbMsg("선호 장르가 저장되었습니다. (For You 추천에 반영됩니다)");
    } catch (e) {
      const serverMsg = e?.response?.data;
      setOnbMsg(typeof serverMsg === "string" ? serverMsg : "저장에 실패했습니다.");
    } finally {
      setOnbBusy(false);
    }
  };

  // ✅ 회원 탈퇴
  const handleDeleteUser = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 되돌릴 수 없습니다.")) return;

    setBusy(true);
    setMessage("");
    try {
      await axiosInstance.delete("/user");
      localStorage.removeItem("token");
      localStorage.removeItem("nickname");
      localStorage.removeItem("userName");
      navigate("/login", { replace: true });
    } catch {
      setMessage("회원 탈퇴에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nickname");
    navigate("/login", { replace: true });
  };

  const profileSrc = profileImage ? `${API_BASE}${profileImage}` : "";

  return (
    <div className="ui-page my-page">
      <div className="ui-shell">
        <div className="ui-brand">🎬 Recommend</div>

        <div className="ui-card">
          <div className="my-header">
            <h2 className="ui-title" style={{ margin: 0 }}>
              마이페이지
            </h2>
            <div className="my-header-actions">
              <button className="ui-btn ui-btn--ghost my-small-btn" onClick={() => navigate("/home")}>
                홈
              </button>
              <button className="ui-btn ui-btn--ghost my-small-btn" onClick={logout}>
                로그아웃
              </button>
            </div>
          </div>

          <p className="ui-desc">프로필/닉네임/비밀번호/선택정보(휴대폰 인증)를 관리할 수 있습니다.</p>

          {/* Profile */}
          <div className="my-profile">
            <div className="my-avatar">
              {profileSrc ? <img src={profileSrc} alt="profile" /> : <div className="my-avatar-fallback">🙂</div>}
            </div>

            <div className="my-profile-actions">
              <label className={`my-file ${busy ? "disabled" : ""}`}>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={busy} />
                프로필 이미지 업로드
              </label>

              {profileImage && (
                <button className="ui-btn ui-btn--ghost my-danger" onClick={handleDeleteImage} disabled={busy} type="button">
                  기본 프로필로 변경
                </button>
              )}
            </div>
          </div>

          <div className="ui-divider" />

          {/* Info */}
          <div className="my-info">
            <div className="my-info-row">
              <span className="my-key">이메일</span>
              <span className="my-val">{loadingMe ? "..." : email}</span>
            </div>
            <div className="my-info-row">
              <span className="my-key">닉네임</span>
              <span className="my-val">{loadingMe ? "..." : nickname}</span>
            </div>
            <div className="my-info-row">
              <span className="my-key">가입일</span>
              <span className="my-val my-mono">{loadingMe ? "..." : formatDateTime(createdAt)}</span>
            </div>
          </div>

          <div className="ui-divider" />

          {/* ✅ Preferred Genres (Onboarding) */}
          <div className="my-block">
            <div className="my-block-title">
              선호 장르 설정{" "}
              {onboardingDone ? (
                <span style={{ opacity: 0.7, fontSize: 12 }}>(설정됨)</span>
              ) : (
                <span style={{ opacity: 0.7, fontSize: 12 }}>(미설정)</span>
              )}
            </div>

            <p className="ui-msg" style={{ marginTop: 6 }}>
              최소 3개 이상 선택하면 For You 추천에 반영됩니다.
            </p>

            <div className="onb-chips" style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(genreOptions.length ? genreOptions : preferredGenres).map((g) => {
                const key = String(g);
                const active = preferredGenres.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`onb-chip ${active ? "active" : ""}`}
                    onClick={() => toggleGenre(key)}
                    disabled={onbBusy}
                    title={key}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                      color: "white",
                      cursor: onbBusy ? "not-allowed" : "pointer",
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <div style={{ opacity: 0.85, fontSize: 13 }}>
                선택됨: <b>{preferredGenres.length}</b> / 3
              </div>

              <button className="ui-btn ui-btn--primary" type="button" onClick={savePreferredGenres} disabled={onbBusy || preferredGenres.length < 3}>
                {onbBusy ? "저장 중..." : "선호 장르 저장"}
              </button>
            </div>

            {onbMsg && (
              <p className={`ui-msg ${onbMsg.includes("실패") || onbMsg.includes("오류") ? "ui-msg--error" : ""}`} style={{ marginTop: 10 }}>
                {onbMsg}
              </p>
            )}
          </div>

          <div className="ui-divider" />

          {/* Nickname */}
          <div className="my-block">
            <div className="my-block-title">닉네임 변경</div>
            <div className="ui-row">
              <input className="ui-input" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="새 닉네임" disabled={busy} />
              <button className="ui-btn ui-btn--primary" onClick={handleUpdateNickname} disabled={busy}>
                저장
              </button>
            </div>
            <p className="ui-msg">저장하면 즉시 반영됩니다.</p>
          </div>

          <div className="ui-divider" />

          {/* Password */}
          <div className="my-block">
            <div className="my-block-title">비밀번호 변경</div>

            <div className="ui-field">
              <input className="ui-input" type="password" placeholder="현재 비밀번호" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} disabled={busy} />
            </div>

            <div className="ui-field">
              <input className="ui-input" type="password" placeholder="새 비밀번호" value={newPw} onChange={(e) => setNewPw(e.target.value)} disabled={busy} />
            </div>

            <button className="ui-btn ui-btn--primary" onClick={handleChangePassword} disabled={busy}>
              비밀번호 변경
            </button>
          </div>

          <div className="ui-divider" />

          {/* ✅ Extra Info */}
          <div className="my-block">
            <div className="my-block-title">추가 정보(선택)</div>

            <div className="ui-field">
              <input className="ui-input" placeholder="실명(선택)" value={realName} onChange={(e) => setRealName(e.target.value)} disabled={busy} />
            </div>

            <div className="ui-field">
              <input className="ui-input" type="date" value={birthDate || ""} onChange={(e) => setBirthDate(e.target.value)} disabled={busy} />
            </div>

            <div className="ui-field">
              <select className="ui-input" value={gender || ""} onChange={(e) => setGender(e.target.value)} disabled={busy}>
                <option value="">성별 선택(선택)</option>
                <option value="M">남성(M)</option>
                <option value="F">여성(F)</option>
              </select>
            </div>

            <div className="ui-field">
              <input className="ui-input" placeholder="휴대폰 번호(선택)" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
              <p className="ui-msg" style={{ marginTop: 6 }}>
                현재 상태:{" "}
                {phoneVerified ? (
                  <b style={{ opacity: 0.95 }}>
                    인증됨{verifiedPhone ? ` (${verifiedPhone})` : ""}
                  </b>
                ) : (
                  <b style={{ opacity: 0.95 }}>미인증</b>
                )}
              </p>
            </div>

            <button className="ui-btn ui-btn--primary" onClick={handleSaveExtraInfo} disabled={busy}>
              추가 정보 저장
            </button>
          </div>

          <div className="ui-divider" />

          {/* ✅ Phone Verification */}
          <div className="my-block">
            <div className="my-block-title">휴대폰 인증</div>

            <div className="ui-row">
              <input className="ui-input" placeholder="휴대폰 번호" value={phoneToVerify} onChange={(e) => setPhoneToVerify(e.target.value)} disabled={busy} />
              <button
                className="ui-btn ui-btn--ghost"
                type="button"
                onClick={requestPhoneVerification}
                disabled={busy || isAlreadyVerifiedSameNumber}
                title={isAlreadyVerifiedSameNumber ? "이미 인증된 번호입니다." : "인증번호 요청"}
              >
                인증번호 요청
              </button>
            </div>

            {isAlreadyVerifiedSameNumber && (
              <p className="ui-msg" style={{ marginTop: 6, opacity: 0.85 }}>
                이미 인증된 휴대폰 번호입니다. (재요청 불가)
              </p>
            )}

            <div className="ui-row" style={{ marginTop: 8 }}>
              <input className="ui-input" placeholder="인증번호(6자리)" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} disabled={busy || isAlreadyVerifiedSameNumber} />
              <button
                className="ui-btn ui-btn--primary"
                type="button"
                onClick={confirmPhoneVerification}
                disabled={busy || isAlreadyVerifiedSameNumber}
                title={isAlreadyVerifiedSameNumber ? "이미 인증된 번호입니다." : "인증 완료"}
              >
                인증 완료
              </button>
            </div>
          </div>

          <div className="ui-divider" />

          {/* Danger */}
          <div className="my-block">
            <div className="my-block-title">회원 탈퇴</div>
            <button className="ui-btn ui-btn--ghost my-danger" onClick={handleDeleteUser} disabled={busy}>
              회원 탈퇴
            </button>
            <p className="ui-msg ui-msg--error">탈퇴는 되돌릴 수 없습니다.</p>
          </div>

          {message && (
            <p className={`ui-msg ${message.includes("실패") || message.includes("오류") ? "ui-msg--error" : ""}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(v) {
  if (!v) return "";
  return String(v).replace("T", " ").split(".")[0];
}

export default MyPage;
