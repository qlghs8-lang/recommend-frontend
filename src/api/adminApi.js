// src/api/adminApi.js
import axiosInstance from "./axiosInstance";

const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.append(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

export const adminApi = {
  // 추천 로그
  recommendLogs: (params = {}) =>
    axiosInstance.get(`/api/admin/recommend-logs${toQuery(params)}`),

  // 추천 대시보드
  dashboard: (days = 7) =>
    axiosInstance.get(`/api/admin/recommend-dashboard${toQuery({ days })}`),

  // source stats
  bySource: (days = 7) =>
    axiosInstance.get(`/api/admin/recommend-stats/by-source${toQuery({ days })}`),

  // =========================
  // ✅ Admin Contents CRUD
  // =========================

  // 목록(페이징 + 검색/필터 + 정렬)
  // params: { page,size,q,type,genre,sort,direction }
  contents: (params = {}) =>
    axiosInstance.get(`/api/admin/contents${toQuery(params)}`),

  contentGet: (id) => axiosInstance.get(`/api/admin/contents/${id}`),

  contentCreate: (payload) => axiosInstance.post(`/api/admin/contents`, payload),

  contentUpdate: (id, payload) =>
    axiosInstance.put(`/api/admin/contents/${id}`, payload),

  contentDelete: (id) => axiosInstance.delete(`/api/admin/contents/${id}`),
};
