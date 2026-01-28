## Recommend Frontend

개인화 콘텐츠 추천 시스템을 위한 프론트엔드 애플리케이션입니다.
JWT 인증 기반 로그인부터 For You 추천 UI, 어드민 대시보드까지 제공합니다.

--

## Tech Stack

React

React Router

Axios

CSS Modules / Custom UI System

JWT Authentication

--

Core Features
Authentication

로그인 / 로그아웃

JWT 저장 및 자동 헤더 첨부

세션 만료 전역 처리

Role 기반 라우팅

User

회원가입 (약관 → 정보입력 → 완료)

휴대폰 인증

온보딩 선호 장르 설정

마이페이지 관리

Content

콘텐츠 탐색

상세 페이지

추천 홈

Recommendation UI

For You 추천 목록

추천 사유 표시

Explore / Exploit 혼합 노출

클릭 로그 연동

Admin Dashboard

추천 로그 조회

CTR 통계

Source 별 성능 분석

Run
1️ Install
npm install


또는

yarn install

2️ Environment Variables

프로젝트 루트에 .env 생성:

REACT_APP_API_BASE_URL=http://localhost:8080

3️ Start Dev Server
npm start

4️ Access
http://localhost:3000

주요 페이지
Path	Description
/login	로그인
/terms	약관 동의
/register	회원가입
/home	추천 홈
/mypage	마이페이지
/admin	관리자 대시보드
Notes

Axios interceptor로 JWT 자동 주입

401/403 시 세션 만료 이벤트 발생

Admin API 연동

반응형 UI 대응

Future Improvements

SSR / SEO 대응 (Next.js)

Skeleton UI

무한 스크롤 추천

추천 모델 시각화

A/B 테스트 UI

Author

박재현

Portfolio Project: Personalized Recommendation System
