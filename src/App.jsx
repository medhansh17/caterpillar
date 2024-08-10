import InspectionForm from "./components/InspectionForm";
import { Routes, Route } from "react-router-dom";
import LogIn from "./components/logIn";
import SignUp from "./components/signUp";
import PrivateRoutes from "./components/protectedRoutes";
import Inspect from "./components/inspection";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/inspectForm" element={<InspectionForm />} />
          <Route path="/inspection" element={<Inspect />} />
        </Route>
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </>
  );
}
