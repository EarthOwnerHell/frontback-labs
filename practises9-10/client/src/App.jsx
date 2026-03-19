import { useState } from "react";
import RegistrationForm from "./components/RegistrationForm";
import ProductPage from "./pages/ProductPage";
import { api } from "./api/index";

function App() {
  const [isAuthorized, setIsAuthorized] = useState(
    Boolean(localStorage.getItem("accessToken")),
  );

  if (!isAuthorized) {
    return <RegistrationForm onAuthSuccess={() => setIsAuthorized(true)} />;
  }

  return (
    <ProductPage
      onLogout={() => {
        api.clearAccessToken();
        setIsAuthorized(false);
      }}
    />
  );
}

export default App;
