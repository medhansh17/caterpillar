import InspectionForm from "./components/InspectionForm";
import { Routes, Route } from "react-router-dom";
import LogIn from "./components/logIn";
import SignUp from "./components/signUp";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<InspectionForm />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </>
  );
}
