import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      const userObject = JSON.parse(userData);

      setName(userObject.name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center">
        <div className="text-xl font-bold">Caterpillar</div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Inspector: {name || "Loading..."}</span>
          <button
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center text-center p-6">
        <h1 className="text-4xl font-extrabold mb-4">
          Welcome to the Home Inspection App
        </h1>
        <p className="text-lg mb-4">
          This app is designed to help you create a home inspection report. You
          can use this app to create a PDF report that you can share with your
          clients.
        </p>
        <p className="text-lg mb-6">
          To get started, click on the "Start Inspection" button below. You can
          then fill out the inspection form and generate a PDF report.
        </p>
        <Link
          to={"/inspection"}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg py-2 px-6 rounded"
        >
          Start Inspection
        </Link>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4">
        <p className="text-sm">
          If you have any questions or need help, please contact us at
          support@inspectionapp.com
        </p>
      </footer>
    </div>
  );
};

export default Landing;
