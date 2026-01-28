import axios from "./axiosInstance";

/* ================= 로그인 ================= */
export async function loginApi(email, password) {
  const response = await axios.post("/login", {
    email,
    password
  });
  return response.data;
}

/* ================= 휴대폰 인증 요청 ================= */
export async function requestPhoneVerification(phone) {
  return axios.post("/user/phone/request", {
    phone
  });
}

/* ================= 휴대폰 인증 확인 ================= */
export async function verifyPhoneCode(code) {
  return axios.post("/user/phone/verify", {
    code
  });
}
