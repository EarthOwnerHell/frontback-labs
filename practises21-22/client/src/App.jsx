import { useState } from "react";
import RegistrationForm from "./components/RegistrationForm";
import ProductPage from "./pages/ProductPage";
import { Route, Routes, Navigate } from "react-router-dom";
import { api } from "./api/index";

function App() {
  const [isAuthorized, setIsAuthorized] = useState(
    Boolean(localStorage.getItem("accessToken")),
  );

  return (
    <>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route
          path="/"
          element={
            <ProductPage
              isAuthorized={isAuthorized}
              onLogout={() => {
                api.clearAccessToken();
                api.setRefreshToken(null);
                setIsAuthorized(false);
              }}
              onLogin={() => setIsAuthorized(true)}
            />
          }
        />

        <Route
          path="/register"
          element={
            <RegistrationForm onAuthSuccess={() => setIsAuthorized(true)} />
          }
        />
      </Routes>
    </>
  );
}

export default App;
