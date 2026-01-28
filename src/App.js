// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthWatcher from "./components/AuthWatcher";

import MainPage from "./components/MainPage";
import LoginPage from "./components/LoginPage";
import TermsPage from "./components/TermsPage";
import RegisterPage from "./components/RegisterPage";
import CompletePage from "./components/CompletePage";
import HomePage from "./components/HomePage";
import MyPage from "./components/MyPage";
import AdminPage from "./components/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      {/* ✅ 전역 만료 처리 */}
      <AuthWatcher />

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/complete" element={<CompletePage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
