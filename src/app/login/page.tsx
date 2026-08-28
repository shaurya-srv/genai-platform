import { Suspense } from "react";
import LoginPage from "./LoginPage";

export default function Login() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#0a0e1a",
        color: "#f3f4f6",
        fontSize: "1.2rem",
      }}>
        Loading...
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
