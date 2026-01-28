// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // ✅ 공개/인증/회원가입 관련 요청은 "세션 만료"로 취급하지 않음
    // - 회원가입 단계는 토큰이 없거나(정상) /public이 permitAll이라야 함
    const skipAuthExpired =
      url.startsWith("/public/") ||
      url.startsWith("/users") ||
      url.startsWith("/login") ||
      url.startsWith("/users/check-email") ||
      url.startsWith("/users/check-nickname");

    if (!skipAuthExpired && (status === 401 || status === 403)) {
      localStorage.removeItem("token");

      window.dispatchEvent(
        new CustomEvent("auth:expired", {
          detail: {
            status,
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
