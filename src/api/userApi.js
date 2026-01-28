import axiosInstance from "./axiosInstance";

export async function checkEmail(email) {
  const res = await axiosInstance.get(`/users/check-email`, { params: { email } });
  return res.data;
}

export async function checkNickname(nickname) {
  const res = await axiosInstance.get(`/users/check-nickname`, { params: { nickname } });
  return res.data;
}

export async function registerUser(user) {
  const res = await axiosInstance.post("/users", user);
  return res.data;
}

// ✅ MyPage용
export async function getMe() {
  const res = await axiosInstance.get("/user/me");
  return res.data;
}

export async function updateNickname(nickname) {
  return axiosInstance.put("/user/nickname", { nickname });
}

export async function changePassword(currentPassword, newPassword) {
  const res = await axiosInstance.put("/user/password", { currentPassword, newPassword });
  return res.data;
}

export async function updateExtraInfo(payload) {
  return axiosInstance.put("/user/extra-info", payload);
}

export async function requestPhoneVerification(phone) {
  return axiosInstance.post("/user/phone/request", { phone });
}

export async function verifyPhoneCode(code) {
  const res = await axiosInstance.post("/user/phone/verify", { code });
  return res.data;
}

export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosInstance.post("/user/profile-image", formData);
  return res.data; // string url
}

export async function deleteProfileImage() {
  return axiosInstance.delete("/user/profile-image");
}

export async function deleteUser() {
  return axiosInstance.delete("/user");
}
