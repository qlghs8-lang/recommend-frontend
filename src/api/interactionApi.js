import axiosInstance from "./axiosInstance";

export const interactionApi = {
  view: (id) => axiosInstance.post(`/api/interactions/${id}/view`),
  like: (id) => axiosInstance.post(`/api/interactions/${id}/like`),
  dislike: (id) => axiosInstance.post(`/api/interactions/${id}/dislike`),
  bookmark: (id) => axiosInstance.post(`/api/interactions/${id}/bookmark`),
  state: (id) => axiosInstance.get(`/api/interactions/${id}/state`),
};
