import axiosInstance from "./axiosInstance";

export async function getTrending(size = 10) {
  const res = await axiosInstance.get("/contents/trending", { params: { size } });
  return res.data;
}

export async function getNewReleases(size = 10) {
  const res = await axiosInstance.get("/contents/new", { params: { size } });
  return res.data;
}

export async function getTopRated(size = 10) {
  const res = await axiosInstance.get("/contents/top-rated", { params: { size } });
  return res.data;
}

// ✅ NEW: 상세 조회
export async function getContentDetail(id) {
  const res = await axiosInstance.get(`/contents/${id}`);
  return res.data;
}

// ✅ NEW: 검색(페이징/정렬/필터)
export async function searchContents(params = {}) {
  const res = await axiosInstance.get("/contents/search", { params });
  return res.data; // Page 형태
}

export async function getGenres() {
  const res = await axiosInstance.get("/contents/genres");
  return res.data; // ["action","anime","drama"...]
}