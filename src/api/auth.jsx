import axios from "axios";

export const login = async (email, password) => {
  try {
    const response = await axios.post(
      `https://caterpillarbackend.onrender.com/users/login`,
      {
        email,
        password,
      }
    );

    if (response.status === 200) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response;
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please check your credentials and try again.");
  }
};

export const signUp = async (username, email, employeeID, password) => {
  try {
    const response = await axios.post(
      `https://caterpillarbackend.onrender.com/users`,
      {
        name: username,
        email: email,
        employeeid: employeeID,
        password: password,
      }
    );

    if (response.status === 201) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    }
  } catch (error) {
    console.error("Sign up error:", error);
    alert("Sign up failed. Please check your details and try again.");
  }
};
