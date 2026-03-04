// Index.tsx is unused — the "/" route maps to Dashboard in App.tsx.
// This file exists only as a fallback. It redirects to home.
import { Navigate } from "react-router-dom";

const Index = () => <Navigate to="/" replace />;

export default Index;
