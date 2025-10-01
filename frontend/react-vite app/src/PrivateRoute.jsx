import { Navigate, useLocation } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // If no token, redirect to login and store where user came from
  if (!token) {
    console.log("Login with no token")
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default PrivateRoute;
