import { Navigate, Outlet } from "react-router-dom";
import { LoadingState } from "../../components/ui/State";
import { useAuth } from "./AuthProvider";

export const ProtectedRoute = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Preparando tu hogar..." />;
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

