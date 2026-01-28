// src/components/AdminPage.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import "./AdminPage.css";

function AdminPage() {
  const navigate = useNavigate();

  // =========================
  // 탭
  // =========================
  const [tab, setTab] = useState("recommend"); // "recommend" | "contents"

  // =========================
  // (A) 추천 대시보드/로그 상태 (기존 그대로)
  // =========================
  const [days, setDays] = useState(7);

  const [source, setSource] = useState("");
  const [clicked, setClicked] = useState(""); // "", "true", "false"
  const [userId, setUserId] = useState("");
  const [contentId, setContentId] = useState("");

  const [dash, setDash] = useState(null);
  const [logs, setLogs] = useState(null);

  const [page, setPage] = useState(0);
  const size = 20;

  const [loadingDash, setLoadingDash] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const totalPages = useMemo(() => logs?.totalPages ?? 0, [logs]);

  const loadDashboard = useCallback(async (d) => {
    setLoadingDash(true);
    setError("");
    try {
      const res = await adminApi.dashboard(d);
      setDash(res.data);
    } catch (e) {
      console.error(e);
      setError("대시보드 조회 실패");
    } finally {
      setLoadingDash(false);
    }
  }, []);

  const buildLogParams = useCallback(
    (p) => {
      const params = { page: p, size, days };
      if (source) params.source = source;
      if (userId) params.userId = userId;
      if (contentId) params.contentId = contentId;
      if (clicked !== "") params.clicked = clicked === "true";
      return params;
    },
    [days, source, clicked, userId, contentId]
  );

  const loadLogs = useCallback(
    async (p) => {
      setLoadingLogs(true);
      setError("");
      try {
        const res = await adminApi.recommendLogs(buildLogParams(p));
        setLogs(res.data);
      } catch (e) {
        console.error(e);
        setError("추천 로그 조회 실패");
      } finally {
        setLoadingLogs(false);
      }
    },
    [buildLogParams]
  );

  // days 변경은 즉시 반영
  useEffect(() => {
    loadDashboard(days);
  }, [days, loadDashboard]);

  // 초기 1회 로드
  useEffect(() => {
    loadLogs(0);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터 변경 시 자동 조회(디바운스)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      loadLogs(0);
    }, 500);
    return () => clearTimeout(t);
  }, [source, clicked, userId, contentId, days, loadLogs]);

  const onPrevPage = async () => {
    if (page <= 0) return;
    const next = page - 1;
    setPage(next);
    await loadLogs(next);
  };

  const onNextPage = async () => {
    if (logs?.last) return;
    const next = page + 1;
    setPage(next);
    await loadLogs(next);
  };

  const closeModal = () => setSelected(null);

  // =========================
  // (B) 콘텐츠 관리 탭 상태 (NEW)
  // =========================
  const [cPage, setCPage] = useState(0);
  const cSize = 20;

  const [q, setQ] = useState("");
  const [cType, setCType] = useState(""); // "" | MOVIE | TV
  const [cGenre, setCGenre] = useState("");
  const [sort, setSort] = useState("id"); // id | releaseDate | rating | viewCount
  const [direction, setDirection] = useState("desc"); // desc | asc

  const [contentPage, setContentPage] = useState(null);
  const [loadingContents, setLoadingContents] = useState(false);

  // 등록/수정 모달
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null이면 create
  const [contentForm, setContentForm] = useState(emptyContentForm());
  const [savingContent, setSavingContent] = useState(false);

  const cTotalPages = useMemo(() => contentPage?.totalPages ?? 0, [contentPage]);

  const loadContents = useCallback(async (p) => {
    setLoadingContents(true);
    setError("");
    try {
      const res = await adminApi.contents({
        page: p,
        size: cSize,
        q,
        type: cType,
        genre: cGenre,
        sort,
        direction,
      });
      setContentPage(res.data);
    } catch (e) {
      console.error(e);
      setError("콘텐츠 목록 조회 실패");
    } finally {
      setLoadingContents(false);
    }
  }, [q, cType, cGenre, sort, direction]);

  // 콘텐츠 탭 진입 시 첫 로드 (한 번은 보장)
  useEffect(() => {
    if (tab !== "contents") return;
    loadContents(0);
    setCPage(0);
  }, [tab, loadContents]);

  // 콘텐츠 필터 변경 디바운스
  useEffect(() => {
    if (tab !== "contents") return;
    const t = setTimeout(() => {
      setCPage(0);
      loadContents(0);
    }, 500);
    return () => clearTimeout(t);
  }, [tab, q, cType, cGenre, sort, direction, loadContents]);

  const openCreate = () => {
    setEditingId(null);
    setContentForm(emptyContentForm());
    setContentModalOpen(true);
  };

  const openEdit = async (id) => {
    setError("");
    try {
      const res = await adminApi.contentGet(id);
      const c = res.data;
      setEditingId(id);
      setContentForm({
        type: c.type ?? "MOVIE",
        title: c.title ?? "",
        overview: c.overview ?? "",
        genres: c.genres ?? "",
        releaseDate: c.releaseDate ?? "",
        posterUrl: c.posterUrl ?? "",
        backdropUrl: c.backdropUrl ?? "",
        rating: c.rating ?? "",
        ratingCount: c.ratingCount ?? "",
        viewCount: c.viewCount ?? "",
      });
      setContentModalOpen(true);
    } catch (e) {
      console.error(e);
      setError("콘텐츠 상세 조회 실패");
    }
  };

  const closeContentModal = () => {
    setContentModalOpen(false);
    setEditingId(null);
    setContentForm(emptyContentForm());
  };

  const onSaveContent = async () => {
    setSavingContent(true);
    setError("");
    try {
      const payload = normalizeContentPayload(contentForm);

      if (!payload.type || !payload.title) {
        setError("type, title은 필수입니다.");
        setSavingContent(false);
        return;
      }

      if (editingId == null) {
        await adminApi.contentCreate(payload);
      } else {
        await adminApi.contentUpdate(editingId, payload);
      }

      closeContentModal();
      await loadContents(cPage);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "저장 실패");
    } finally {
      setSavingContent(false);
    }
  };

  const onDeleteContent = async (id) => {
    const ok = window.confirm(`콘텐츠(id=${id})를 삭제할까?`);
    if (!ok) return;

    setError("");
    try {
      await adminApi.contentDelete(id);
      // 삭제 후 현재 페이지 다시 로드 (비면 이전 페이지로)
      const nextPage = cPage;
      await loadContents(nextPage);
    } catch (e) {
      console.error(e);
      setError("삭제 실패");
    }
  };

  const onPrevCPage = async () => {
    if (cPage <= 0) return;
    const next = cPage - 1;
    setCPage(next);
    await loadContents(next);
  };

  const onNextCPage = async () => {
    if (contentPage?.last) return;
    const next = cPage + 1;
    setCPage(next);
    await loadContents(next);
  };

  // =========================
  // 공통
  // =========================
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Admin Dashboard</div>
        <div className="admin-header-right">
          <button className="btn-ghost" onClick={() => navigate("/home")}>
            홈으로
          </button>
          <button className="btn-ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>

      {/* ✅ 탭 */}
      <div className="admin-tabs">
        <button
          className={tab === "recommend" ? "admin-tab active" : "admin-tab"}
          onClick={() => setTab("recommend")}
          type="button"
        >
          추천 분석
        </button>
        <button
          className={tab === "contents" ? "admin-tab active" : "admin-tab"}
          onClick={() => setTab("contents")}
          type="button"
        >
          콘텐츠 관리
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* =========================
          탭: 추천 분석(기존)
         ========================= */}
      {tab === "recommend" && (
        <>
          {/* KPI */}
          <div className="admin-section">
            <div className="admin-section-header">
              <div className="admin-section-title">요약</div>
              <div className="admin-controls">
                <span className="admin-control-label">기간</span>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="admin-select"
                  disabled={loadingDash}
                >
                  <option value={1}>1일</option>
                  <option value={3}>3일</option>
                  <option value={7}>7일</option>
                  <option value={14}>14일</option>
                  <option value={30}>30일</option>
                </select>
              </div>
            </div>

            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Impressions</div>
                <div className="admin-kpi-value">
                  {loadingDash ? "..." : dash?.impressions ?? 0}
                </div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Clicks</div>
                <div className="admin-kpi-value">
                  {loadingDash ? "..." : dash?.clicks ?? 0}
                </div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">CTR</div>
                <div className="admin-kpi-value">
                  {loadingDash
                    ? "..."
                    : `${(((dash?.ctr ?? 0) * 100) || 0).toFixed(2)}%`}
                </div>
              </div>
            </div>

            {/* Source CTR bar */}
            <div className="admin-subsection">
              <div className="admin-subtitle">Source breakdown</div>

              {(dash?.bySource || []).length === 0 ? (
                <div className="admin-empty">데이터 없음</div>
              ) : (
                <div className="source-bars">
                  {(dash?.bySource || []).map((row) => {
                    const pct = Math.max(0, Math.min(100, (row.ctr ?? 0) * 100));
                    return (
                      <div key={row.source} className="source-bar-row">
                        <div className="source-bar-left">
                          <div className="source-name">{row.source}</div>
                          <div className="source-metrics">
                            imp {row.impressions} · clk {row.clicks} ·{" "}
                            {pct.toFixed(2)}%
                          </div>
                        </div>
                        <div className="source-bar-track">
                          <div
                            className="source-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Logs + Filters */}
          <div className="admin-section">
            <div className="admin-section-header">
              <div className="admin-section-title">추천 노출 로그</div>
              <div className="admin-controls">
                <button
                  className="btn-ghost"
                  onClick={() => loadLogs(page)}
                  disabled={loadingLogs}
                >
                  새로고침
                </button>
              </div>
            </div>

            <div className="admin-filter">
              <input
                className="admin-input"
                placeholder="source (예: CONTENT_BASED)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
              <select
                className="admin-select"
                value={clicked}
                onChange={(e) => setClicked(e.target.value)}
              >
                <option value="">clicked 전체</option>
                <option value="true">clicked=Y</option>
                <option value="false">clicked=N</option>
              </select>
              <input
                className="admin-input"
                placeholder="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <input
                className="admin-input"
                placeholder="contentId"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
              />
              <div className="admin-filter-hint">
                {loadingLogs ? "조회중..." : "입력 후 자동 반영"}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table admin-table-wide">
                <thead>
                  <tr>
                    <th className="th">createdAt</th>
                    <th className="th th-right">logId</th>
                    <th className="th th-right">userId</th>
                    <th className="th th-right">contentId</th>
                    <th className="th">title</th>
                    <th className="th">source</th>
                    <th className="th">clicked</th>
                    <th className="th">reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(logs?.content || []).map((r) => (
                    <tr
                      key={r.recommendLogId}
                      className="row-clickable"
                      onClick={() => setSelected(r)}
                      title="클릭하면 상세 보기"
                    >
                      <td className="td td-mono">{formatDateTime(r.createdAt)}</td>
                      <td className="td td-right td-mono">{r.recommendLogId}</td>
                      <td className="td td-right td-mono">{r.userId}</td>
                      <td className="td td-right td-mono">{r.contentId}</td>
                      <td className="td">{r.contentTitle}</td>
                      <td className="td td-mono">{r.source}</td>
                      <td className="td">
                        <span
                          className={r.clicked ? "badge badge-yes" : "badge badge-no"}
                        >
                          {r.clicked ? "Y" : "N"}
                        </span>
                      </td>
                      <td className="td td-reason" title={r.reason || ""}>
                        {r.reason}
                      </td>
                    </tr>
                  ))}

                  {loadingLogs && (
                    <tr>
                      <td className="td" colSpan={8}>
                        로딩중...
                      </td>
                    </tr>
                  )}

                  {!loadingLogs && (!logs?.content || logs.content.length === 0) && (
                    <tr>
                      <td className="td" colSpan={8}>
                        데이터 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-pager">
              <button
                className="btn-ghost"
                onClick={onPrevPage}
                disabled={page <= 0 || loadingLogs}
              >
                이전
              </button>
              <div className="admin-pager-text">
                page {page + 1} / {totalPages || 1}
              </div>
              <button
                className="btn-ghost"
                onClick={onNextPage}
                disabled={logs?.last || loadingLogs}
              >
                다음
              </button>
            </div>
          </div>

          {/* Recommend Log Modal */}
          {selected && (
            <div className="modal-backdrop" onClick={closeModal} role="presentation">
              <div
                className="admin-modal"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                <div className="admin-modal-header">
                  <div className="admin-modal-title">추천 로그 상세</div>
                  <button className="btn-ghost" onClick={closeModal}>
                    닫기
                  </button>
                </div>

                <div className="admin-modal-grid">
                  <div className="kv">
                    <div className="k">createdAt</div>
                    <div className="v td-mono">{formatDateTime(selected.createdAt)}</div>
                  </div>
                  <div className="kv">
                    <div className="k">recommendLogId</div>
                    <div className="v td-mono">{selected.recommendLogId}</div>
                  </div>
                  <div className="kv">
                    <div className="k">userId</div>
                    <div className="v td-mono">{selected.userId}</div>
                  </div>
                  <div className="kv">
                    <div className="k">contentId</div>
                    <div className="v td-mono">{selected.contentId}</div>
                  </div>
                  <div className="kv">
                    <div className="k">title</div>
                    <div className="v">{selected.contentTitle}</div>
                  </div>
                  <div className="kv">
                    <div className="k">source</div>
                    <div className="v td-mono">{selected.source}</div>
                  </div>
                  <div className="kv">
                    <div className="k">clicked</div>
                    <div className="v">{selected.clicked ? "Y" : "N"}</div>
                  </div>
                </div>

                <div className="admin-modal-reason">
                  <div className="admin-modal-subtitle">reason</div>
                  <div className="admin-modal-reason-text">
                    {selected.reason || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================
          탭: 콘텐츠 관리(NEW)
         ========================= */}
      {tab === "contents" && (
        <div className="admin-section">
          <div className="admin-section-header">
            <div className="admin-section-title">콘텐츠 관리</div>
            <div className="admin-controls">
              <button className="btn-ghost" onClick={openCreate}>
                + 등록
              </button>
              <button
                className="btn-ghost"
                onClick={() => loadContents(cPage)}
                disabled={loadingContents}
              >
                새로고침
              </button>
            </div>
          </div>

          {/* filters */}
          <div className="admin-filter">
            <input
              className="admin-input"
              placeholder="검색(q): title/overview"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="admin-select"
              value={cType}
              onChange={(e) => setCType(e.target.value)}
            >
              <option value="">type 전체</option>
              <option value="MOVIE">MOVIE</option>
              <option value="TV">TV</option>
            </select>
            <input
              className="admin-input"
              placeholder="genre 포함 검색 (예: action)"
              value={cGenre}
              onChange={(e) => setCGenre(e.target.value)}
            />
            <select
              className="admin-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="id">sort: id</option>
              <option value="releaseDate">sort: releaseDate</option>
              <option value="rating">sort: rating</option>
              <option value="viewCount">sort: viewCount</option>
            </select>
            <select
              className="admin-select"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
            <div className="admin-filter-hint">
              {loadingContents ? "조회중..." : "입력 후 자동 반영"}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-table-wide">
              <thead>
                <tr>
                  <th className="th th-right">id</th>
                  <th className="th">type</th>
                  <th className="th">title</th>
                  <th className="th">genres</th>
                  <th className="th">releaseDate</th>
                  <th className="th th-right">rating</th>
                  <th className="th th-right">viewCount</th>
                  <th className="th">actions</th>
                </tr>
              </thead>
              <tbody>
                {(contentPage?.content || []).map((c) => (
                  <tr key={c.id} className="row-clickable" title="클릭하면 수정">
                    <td className="td td-right td-mono" onClick={() => openEdit(c.id)}>
                      {c.id}
                    </td>
                    <td className="td td-mono" onClick={() => openEdit(c.id)}>
                      {c.type}
                    </td>
                    <td className="td" onClick={() => openEdit(c.id)}>
                      {c.title}
                    </td>
                    <td className="td td-mono" onClick={() => openEdit(c.id)}>
                      {c.genres || "-"}
                    </td>
                    <td className="td td-mono" onClick={() => openEdit(c.id)}>
                      {c.releaseDate || "-"}
                    </td>
                    <td className="td td-right td-mono" onClick={() => openEdit(c.id)}>
                      {c.rating ?? "-"}
                    </td>
                    <td className="td td-right td-mono" onClick={() => openEdit(c.id)}>
                      {c.viewCount ?? 0}
                    </td>
                    <td className="td">
                      <button className="btn-ghost" onClick={() => openEdit(c.id)}>
                        수정
                      </button>
                      <button className="btn-ghost" onClick={() => onDeleteContent(c.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}

                {loadingContents && (
                  <tr>
                    <td className="td" colSpan={8}>
                      로딩중...
                    </td>
                  </tr>
                )}

                {!loadingContents &&
                  (!contentPage?.content || contentPage.content.length === 0) && (
                    <tr>
                      <td className="td" colSpan={8}>
                        데이터 없음
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="admin-pager">
            <button
              className="btn-ghost"
              onClick={onPrevCPage}
              disabled={cPage <= 0 || loadingContents}
            >
              이전
            </button>
            <div className="admin-pager-text">
              page {cPage + 1} / {cTotalPages || 1}
            </div>
            <button
              className="btn-ghost"
              onClick={onNextCPage}
              disabled={contentPage?.last || loadingContents}
            >
              다음
            </button>
          </div>

          {/* Content Modal */}
          {contentModalOpen && (
            <div className="modal-backdrop" onClick={closeContentModal} role="presentation">
              <div
                className="admin-modal admin-modal-wide"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                <div className="admin-modal-header">
                  <div className="admin-modal-title">
                    {editingId == null ? "콘텐츠 등록" : `콘텐츠 수정 (id=${editingId})`}
                  </div>
                  <button className="btn-ghost" onClick={closeContentModal}>
                    닫기
                  </button>
                </div>

                <div className="admin-form-grid">
                  <label className="admin-form-item">
                    <div className="admin-form-label">type *</div>
                    <select
                      className="admin-select"
                      value={contentForm.type}
                      onChange={(e) => setContentForm((p) => ({ ...p, type: e.target.value }))}
                    >
                      <option value="MOVIE">MOVIE</option>
                      <option value="TV">TV</option>
                    </select>
                  </label>

                  <label className="admin-form-item admin-form-span2">
                    <div className="admin-form-label">title *</div>
                    <input
                      className="admin-input"
                      value={contentForm.title}
                      onChange={(e) => setContentForm((p) => ({ ...p, title: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item admin-form-span2">
                    <div className="admin-form-label">overview</div>
                    <textarea
                      className="admin-textarea"
                      rows={4}
                      value={contentForm.overview}
                      onChange={(e) => setContentForm((p) => ({ ...p, overview: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item admin-form-span2">
                    <div className="admin-form-label">genres (CSV)</div>
                    <input
                      className="admin-input"
                      placeholder="Action,Drama"
                      value={contentForm.genres}
                      onChange={(e) => setContentForm((p) => ({ ...p, genres: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item">
                    <div className="admin-form-label">releaseDate</div>
                    <input
                      className="admin-input"
                      placeholder="YYYY-MM-DD"
                      value={contentForm.releaseDate}
                      onChange={(e) => setContentForm((p) => ({ ...p, releaseDate: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item">
                    <div className="admin-form-label">rating</div>
                    <input
                      className="admin-input"
                      placeholder="예: 8.7"
                      value={contentForm.rating}
                      onChange={(e) => setContentForm((p) => ({ ...p, rating: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item">
                    <div className="admin-form-label">ratingCount</div>
                    <input
                      className="admin-input"
                      placeholder="예: 1200"
                      value={contentForm.ratingCount}
                      onChange={(e) => setContentForm((p) => ({ ...p, ratingCount: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item">
                    <div className="admin-form-label">viewCount</div>
                    <input
                      className="admin-input"
                      placeholder="예: 100"
                      value={contentForm.viewCount}
                      onChange={(e) => setContentForm((p) => ({ ...p, viewCount: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item admin-form-span2">
                    <div className="admin-form-label">posterUrl</div>
                    <input
                      className="admin-input"
                      value={contentForm.posterUrl}
                      onChange={(e) => setContentForm((p) => ({ ...p, posterUrl: e.target.value }))}
                    />
                  </label>

                  <label className="admin-form-item admin-form-span2">
                    <div className="admin-form-label">backdropUrl</div>
                    <input
                      className="admin-input"
                      value={contentForm.backdropUrl}
                      onChange={(e) => setContentForm((p) => ({ ...p, backdropUrl: e.target.value }))}
                    />
                  </label>
                </div>

                <div className="admin-modal-footer">
                  <button className="btn-ghost" onClick={closeContentModal} disabled={savingContent}>
                    취소
                  </button>
                  <button className="btn-primary" onClick={onSaveContent} disabled={savingContent}>
                    {savingContent ? "저장중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function emptyContentForm() {
  return {
    type: "MOVIE",
    title: "",
    overview: "",
    genres: "",
    releaseDate: "",
    posterUrl: "",
    backdropUrl: "",
    rating: "",
    ratingCount: "",
    viewCount: "",
  };
}

function normalizeContentPayload(f) {
  const payload = {
    type: (f.type || "").trim(),
    title: (f.title || "").trim(),
    overview: f.overview ?? "",
    genres: f.genres ?? "",
    releaseDate: (f.releaseDate || "").trim() || null,
    posterUrl: f.posterUrl ?? "",
    backdropUrl: f.backdropUrl ?? "",
    rating: f.rating === "" ? null : Number(f.rating),
    ratingCount: f.ratingCount === "" ? null : Number(f.ratingCount),
    viewCount: f.viewCount === "" ? null : Number(f.viewCount),
  };

  // 숫자 파싱 실패 방어
  if (payload.rating != null && Number.isNaN(payload.rating)) payload.rating = null;
  if (payload.ratingCount != null && Number.isNaN(payload.ratingCount)) payload.ratingCount = null;
  if (payload.viewCount != null && Number.isNaN(payload.viewCount)) payload.viewCount = null;

  return payload;
}

function formatDateTime(v) {
  if (!v) return "";
  return String(v).replace("T", " ").split(".")[0];
}

export default AdminPage;
