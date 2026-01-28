import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

import axiosInstance from "../api/axiosInstance";
import {
  getTrending,
  getNewReleases,
  getTopRated,
  searchContents,
  getContentDetail,
} from "../api/contentApi";
import { recommendApi } from "../api/recommendApi";
import { interactionApi } from "../api/interactionApi";

/**
 * ✅ 기본 장르(라벨 품질용)
 * - 여기 없는 장르는 /contents/genres 로 받아온 값이 자동 추가됨
 */
const BASE_GENRES = [
  { key: "action", label: "Action" },
  { key: "adventure", label: "Adventure" },
  { key: "animation", label: "Animation" },
  { key: "comedy", label: "Comedy" },
  { key: "crime", label: "Crime" },
  { key: "documentary", label: "Documentary" },
  { key: "drama", label: "Drama" },
  { key: "family", label: "Family" },
  { key: "fantasy", label: "Fantasy" },
  { key: "history", label: "History" },
  { key: "horror", label: "Horror" },
  { key: "music", label: "Music" },
  { key: "mystery", label: "Mystery" },
  { key: "romance", label: "Romance" },
  { key: "sci-fi", label: "Sci-Fi" },
  { key: "thriller", label: "Thriller" },
  { key: "war", label: "War" },
  { key: "western", label: "Western" },
];

function HomePage() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [hero, setHero] = useState(null);
  const [rows, setRows] = useState([]);
  const [modalItem, setModalItem] = useState(null);

  const [interactionState, setInteractionState] = useState({
    liked: false,
    disliked: false,
    bookmarked: false,
  });

  // ✅ 온보딩 상태
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [onboardingMsg, setOnboardingMsg] = useState("");
  const [onboardingBusy, setOnboardingBusy] = useState(false);

  // ✅ 검색 상태
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "", "MOVIE", "TV"
  const [genreFilter, setGenreFilter] = useState(""); // "", "action"...
  const [sortKey, setSortKey] = useState("viewCount"); // id/releaseDate/rating/viewCount
  const [sortDir, setSortDir] = useState("desc");

  const [searchMode, setSearchMode] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchPage, setSearchPage] = useState(null); // spring Page
  const [searchPageIndex, setSearchPageIndex] = useState(0);

  // ✅ 장르 옵션(동적)
  const [genreOptions, setGenreOptions] = useState(BASE_GENRES);

  const placeholderPoster = useMemo(
    () => "https://picsum.photos/seed/fallback-poster/260/390",
    []
  );

  const placeholderBackdrop = useMemo(
    () => "https://picsum.photos/seed/fallback-backdrop/1200/500",
    []
  );

  const getYear = useCallback((item) => {
    if (item?.releaseDate && typeof item.releaseDate === "string") {
      return item.releaseDate.slice(0, 4);
    }
    return item?.year || "";
  }, []);

  const normalizeItem = useCallback(
    (c) => ({
      id: c.id,
      title: c.title,
      year: getYear(c),
      overview: c.overview || "",
      posterUrl: c.posterUrl || placeholderPoster,
      backdropUrl: c.backdropUrl || placeholderBackdrop,
      rating: c.rating ?? "-",
      ratingCount: c.ratingCount ?? null,
      viewCount: c.viewCount ?? null,
      releaseDate: c.releaseDate ?? null,
      genres: c.genres || "",
      type: c.type || "",
      reason: c.reason || "",
      source: c.source || "",
      recommendLogId: c.recommendLogId ?? null,
    }),
    [getYear, placeholderPoster, placeholderBackdrop]
  );

  // =========================
  // ✅ utils: 장르 label prettify
  // =========================
  const prettyGenreLabel = useCallback((key) => {
    if (!key) return "";
    const k = String(key).trim().toLowerCase();
    if (k === "sci-fi" || k === "scifi" || k === "sci fi") return "Sci-Fi";

    // anime, k-drama, tv_movie 같은 케이스 커버
    const parts = k.split(/[-_ ]+/).filter(Boolean);
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }, []);

  // =========================
  // ✅ 내 정보 로드
  // =========================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axiosInstance.get("/user/me");
        setNickname(res.data?.nickname || "");
      } catch (e) {
        navigate("/login", { replace: true });
      }
    };
    loadUser();
  }, [navigate]);

  // =========================
  // ✅ DB 기반 장르 로드 (/contents/genres)
  // =========================
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await axiosInstance.get("/contents/genres");
        const apiGenres = Array.isArray(res.data) ? res.data : [];

        // BASE + API merge (key 기준 distinct)
        const baseMap = new Map(
          BASE_GENRES.map((g) => [String(g.key).toLowerCase(), g.label])
        );

        const mergedSet = new Set([
          ...BASE_GENRES.map((g) => String(g.key).toLowerCase()),
          ...apiGenres.map((g) => String(g).trim().toLowerCase()).filter(Boolean),
        ]);

        const merged = Array.from(mergedSet)
          .map((k) => ({
            key: k,
            label: baseMap.get(k) || prettyGenreLabel(k),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setGenreOptions(merged);
      } catch (e) {
        // API 없거나 에러면 기본만 유지
        setGenreOptions(BASE_GENRES);
      }
    };

    loadGenres();
  }, [prettyGenreLabel]);

  // =========================
  // ✅ 온보딩 상태 로드
  // =========================
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const res = await axiosInstance.get("/user/onboarding");
        const done = !!res.data?.onboardingDone;
        const pref = Array.isArray(res.data?.preferredGenres)
          ? res.data.preferredGenres
          : [];

        if (!done) {
          setSelectedGenres(pref);
          setShowOnboarding(true);
        }
      } catch (e) {
        // 백엔드 반영 전이면 무시
      }
    };

    loadOnboarding();
  }, []);

  // =========================
  // ✅ 콘텐츠 로드 (기본 홈)
  // =========================
  const loadContents = useCallback(async () => {
    try {
      const [trendingRaw, newRaw, topRaw, forYouReasonRaw] = await Promise.all([
        getTrending(60),
        getNewReleases(24),
        getTopRated(24),
        recommendApi.forYouReason(20),
      ]);

      const trending = (trendingRaw || []).map(normalizeItem);
      const newest = (newRaw || []).map(normalizeItem);
      const topRated = (topRaw || []).map(normalizeItem);
      const forYou = (forYouReasonRaw.data || []).map(normalizeItem);

      setHero(forYou[0] || trending[0] || newest[0] || null);

      setRows([
        { key: "forYou", title: "For You", items: forYou.slice(0, 12), showReason: true },
        { key: "trending", title: "인기 급상승", items: trending.slice(0, 12), showReason: false },
        { key: "new", title: "최신 공개", items: newest.slice(0, 12), showReason: false },
        { key: "topRated", title: "평점 높은 콘텐츠", items: topRated.slice(0, 12), showReason: false },
      ]);
    } catch (e) {
      console.error("콘텐츠 로드 실패:", e);
      setHero(null);
      setRows([]);
    }
  }, [normalizeItem]);

  useEffect(() => {
    if (!searchMode) loadContents();
  }, [loadContents, searchMode]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  // =========================
  // ✅ 검색 실행 (수동 버튼 전용)
  // - 자동 디바운스 제거
  // - 페이지 사이즈: 10으로 고정 (요청사항)
  // =========================
  const runSearch = useCallback(
    async (page = 0) => {
      setSearchBusy(true);
      setSearchError("");

      try {
        const params = {
          q: q.trim() || undefined,
          type: typeFilter || undefined,
          genre: genreFilter || undefined,
          page,
          size: 10, // ✅ 10개씩
          sort: sortKey,
          direction: sortDir,
        };

        const data = await searchContents(params);
        const normalized = {
          ...data,
          content: (data?.content || []).map(normalizeItem),
        };

        setSearchPageIndex(page);
        setSearchPage(normalized);
        setSearchMode(true);

        // ✅ 더 깔끔한 옵션: 검색 결과 없으면 hero 아예 안 건드리기
        if ((normalized.content || []).length > 0) {
          setHero(normalized.content[0]);
        }
      } catch (e) {
        console.error("search fail", e);
        setSearchError("검색에 실패했습니다.");
        setSearchPage(null);
      } finally {
        setSearchBusy(false);
      }
    },
    [q, typeFilter, genreFilter, sortKey, sortDir, normalizeItem]
  );

  const clearSearch = async () => {
    setQ("");
    setTypeFilter("");
    setGenreFilter("");
    setSearchMode(false);
    setSearchPage(null);
    setSearchError("");
    setSearchPageIndex(0);
    await loadContents();
  };

  // =========================
  // ✅ 카드 클릭
  // =========================
  const onCardClick = async (item) => {
    // 1) 추천 클릭 로그 (forYou인 경우만)
    try {
      if (item.recommendLogId) {
        await recommendApi.click(item.recommendLogId);
      }
    } catch (e) {}

    // 2) 상세를 다시 로드해서 모달 풍부하게
    let detailed = item;
    try {
      const raw = await getContentDetail(item.id);
      detailed = {
        ...normalizeItem(raw),
        reason: item.reason || "",
        source: item.source || "",
        recommendLogId: item.recommendLogId ?? null,
      };
    } catch (e) {}

    setModalItem(detailed);

    // 3) view + state
    try {
      await interactionApi.view(item.id);
      const res = await interactionApi.state(item.id);
      setInteractionState(res.data);
    } catch (e) {
      console.error("onCardClick fail", e);
    }
  };

  const closeModal = () => {
    setModalItem(null);
    setInteractionState({ liked: false, disliked: false, bookmarked: false });
  };

  const toggleLike = async () => {
    const res = await interactionApi.like(modalItem.id);
    setInteractionState(res.data);
  };

  const toggleDislike = async () => {
    const res = await interactionApi.dislike(modalItem.id);
    setInteractionState(res.data);
  };

  const toggleBookmark = async () => {
    const res = await interactionApi.bookmark(modalItem.id);
    setInteractionState(res.data);
  };

  // =========================
  // ✅ 온보딩: 장르 선택 토글 (동적 장르에도 대응)
  // =========================
  const toggleGenre = (g) => {
    setOnboardingMsg("");
    setSelectedGenres((prev) => {
      const set = new Set(prev);
      if (set.has(g)) set.delete(g);
      else set.add(g);
      return Array.from(set);
    });
  };

  const saveOnboarding = async () => {
    if (selectedGenres.length < 3) {
      setOnboardingMsg("장르는 최소 3개 이상 선택해야 합니다.");
      return;
    }

    setOnboardingBusy(true);
    setOnboardingMsg("");
    try {
      await axiosInstance.put("/user/onboarding/genres", { genres: selectedGenres });
      setShowOnboarding(false);
      await loadContents();
    } catch (e) {
      const msg = e?.response?.data;
      setOnboardingMsg(typeof msg === "string" ? msg : "저장에 실패했습니다.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const searchHasAny =
    q.trim() !== "" || typeFilter !== "" || genreFilter !== "";

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-right">
          <button className="ghost-btn" onClick={() => navigate("/mypage")} type="button">
            마이페이지
          </button>
          <button className="ghost-btn" onClick={logout} type="button">
            로그아웃
          </button>
        </div>
      </header>

      {/* ✅ Search Bar */}
      <div className="home-search">
        <div className="home-search-row">
          <input
            className="home-search-input"
            placeholder="제목/줄거리로 검색 (예: dark, avengers...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="home-search-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            title="type"
          >
            <option value="">전체</option>
            <option value="MOVIE">MOVIE</option>
            <option value="TV">TV</option>
          </select>

          <select
            className="home-search-select"
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            title="genre"
          >
            <option value="">장르 전체</option>
            {genreOptions.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>

          <select
            className="home-search-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            title="sort"
          >
            <option value="viewCount">조회수</option>
            <option value="releaseDate">개봉일</option>
            <option value="rating">평점</option>
            <option value="id">최신등록(id)</option>
          </select>

          <select
            className="home-search-select"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
            title="direction"
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>

          <button
            className="ghost-btn"
            type="button"
            onClick={() => (searchHasAny ? runSearch(0) : clearSearch())}
            disabled={searchBusy}
          >
            {searchHasAny ? "검색" : "초기화"}
          </button>

          {(searchMode || searchHasAny) && (
            <button className="ghost-btn" type="button" onClick={clearSearch} disabled={searchBusy}>
              검색 종료
            </button>
          )}
        </div>

        {/* ✅ 움찔 방지: hint 영역은 항상 자리 확보 */}
        <div className="home-search-hint-slot" style={{ minHeight: 18 }}>
          {searchBusy ? <div className="home-search-hint">검색중...</div> : null}
          {!searchBusy && searchError ? (
            <div className="home-search-hint error">{searchError}</div>
          ) : null}
        </div>
      </div>

      {/* ✅ Onboarding Modal */}
      {showOnboarding && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal onboarding-modal" role="presentation">
            <h2 style={{ marginTop: 0 }}>선호 장르 선택</h2>
            <p style={{ opacity: 0.9, marginTop: 6 }}>
              최소 3개를 선택하면, 바로 개인화 추천이 시작됩니다.
            </p>

            <div className="onb-chips">
              {genreOptions.map((g) => {
                const active = selectedGenres.includes(g.key);
                return (
                  <button
                    key={g.key}
                    type="button"
                    className={`onb-chip ${active ? "active" : ""}`}
                    onClick={() => toggleGenre(g.key)}
                    disabled={onboardingBusy}
                    title={g.key}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            <div className="onb-footer">
              <div className="onb-hint">
                선택됨: <b>{selectedGenres.length}</b> / 3
              </div>

              <button
                className="primary-btn"
                type="button"
                onClick={saveOnboarding}
                disabled={onboardingBusy || selectedGenres.length < 3}
              >
                {onboardingBusy ? "저장 중..." : "저장하고 시작"}
              </button>
            </div>

            {onboardingMsg && (
              <p className="ui-msg ui-msg--error" style={{ marginTop: 10 }}>
                {onboardingMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      {hero && (
        <section
          className="hero"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.95)), url(${hero.backdropUrl})`,
          }}
        >
          <div className="hero-content">
            <div className="hero-badge">
              {searchMode ? "검색 결과" : nickname ? `${nickname}님을 위한 추천` : "추천"}
            </div>
            <h1 className="hero-title">{hero.title}</h1>
            <p className="hero-overview">{hero.overview}</p>
          </div>
        </section>
      )}

      {/* Main */}
      <main className="rows">
        {/* ✅ Search Results (10개 페이징) */}
        {searchMode && (
          <section className="row">
            <div className="row-title">
              검색 결과{" "}
              <span style={{ opacity: 0.7, fontSize: 13, marginLeft: 8 }}>
                {searchPage?.totalElements ?? 0}개
              </span>
            </div>

            <div className="row-track">
              {(searchPage?.content || []).map((item) => (
                <button
                  key={`search-${item.id}`}
                  className="card"
                  onClick={() => onCardClick(item)}
                  type="button"
                >
                  <div className="card-media">
                    <img className="card-img" src={item.posterUrl} alt={item.title} />
                  </div>
                </button>
              ))}

              {!searchBusy && (!searchPage?.content || searchPage.content.length === 0) && (
                <div style={{ padding: 12, opacity: 0.8 }}>검색 결과가 없습니다.</div>
              )}
            </div>

            {/* pagination */}
            <div className="admin-pager" style={{ marginTop: 10 }}>
              <button
                className="btn-ghost"
                onClick={() => runSearch(Math.max(0, searchPageIndex - 1))}
                disabled={searchBusy || searchPageIndex <= 0}
              >
                이전
              </button>
              <div className="admin-pager-text">
                page {searchPageIndex + 1} / {Math.max(1, searchPage?.totalPages ?? 1)}
              </div>
              <button
                className="btn-ghost"
                onClick={() => runSearch(searchPageIndex + 1)}
                disabled={searchBusy || !!searchPage?.last}
              >
                다음
              </button>
            </div>
          </section>
        )}

        {/* ✅ Default Rows */}
        {!searchMode &&
          rows.map((row) => (
            <section key={row.key} className="row">
              <div className="row-title">{row.title}</div>
              <div className="row-track">
                {row.items.map((item) => (
                  <button
                    key={`${row.key}-${item.id}-${item.recommendLogId ?? "na"}`}
                    className="card"
                    onClick={() => onCardClick(item)}
                    type="button"
                  >
                    <div className="card-media">
                      <img className="card-img" src={item.posterUrl} alt={item.title} />
                      {row.showReason && item.reason && (
                        <div className="card-reason">{item.reason}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
      </main>

      {/* Modal */}
      {modalItem && (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="presentation">
            <h2 style={{ marginTop: 0 }}>{modalItem.title}</h2>

            <div style={{ opacity: 0.85, marginTop: 6, fontSize: 13 }}>
              {modalItem.type ? <span>{modalItem.type}</span> : null}
              {modalItem.releaseDate ? <span> · {String(modalItem.releaseDate)}</span> : null}
              {modalItem.genres ? <span> · {modalItem.genres}</span> : null}
              {modalItem.rating !== "-" ? (
                <span>
                  {" "}
                  · ⭐ {modalItem.rating}
                  {modalItem.ratingCount != null ? ` (${modalItem.ratingCount})` : ""}
                </span>
              ) : null}
              {modalItem.viewCount != null ? <span> · 👀 {modalItem.viewCount}</span> : null}
            </div>

            {modalItem.reason ? (
              <div style={{ marginTop: 10, opacity: 0.9, fontSize: 13 }}>
                <b>추천 이유</b>: {modalItem.reason}
                {modalItem.source ? (
                  <span style={{ opacity: 0.7 }}> ({modalItem.source})</span>
                ) : null}
              </div>
            ) : null}

            <p style={{ marginTop: 12 }}>{modalItem.overview || "-"}</p>

            <div className="modal-actions">
              <button
                className={interactionState.liked ? "primary-btn" : "secondary-btn"}
                onClick={toggleLike}
                type="button"
              >
                👍 좋아요
              </button>

              <button
                className={interactionState.disliked ? "primary-btn" : "secondary-btn"}
                onClick={toggleDislike}
                type="button"
              >
                👎 싫어요
              </button>

              <button
                className={interactionState.bookmarked ? "primary-btn" : "secondary-btn"}
                onClick={toggleBookmark}
                type="button"
              >
                ⭐ 찜
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
