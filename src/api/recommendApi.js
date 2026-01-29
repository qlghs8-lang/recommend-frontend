import axiosInstance from "./axiosInstance";

export const recommendApi = {
  forYou: (size = 20) => axiosInstance.get(`/api/recommend/for-you?size=${size}`),

  forYouReason: (size = 20) =>
    axiosInstance.get(`/api/recommend/for-you/reason?size=${size}`),

  // 추천 클릭 로그 저장 (CTR 학습용)
  click: (recommendLogId) =>
    axiosInstance.post(`/api/recommend/click/${recommendLogId}`),
};
