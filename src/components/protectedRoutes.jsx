import { Navigate, Outlet } from "react-router-dom";

const PrivateRoutes = () => {
  const auth = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  return auth && user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoutes;
