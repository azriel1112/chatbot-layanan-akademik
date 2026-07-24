import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./pages/Home";
import Evaluation from "./pages/Evaluation";
import "./styles/app.css";

const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";

const Page = normalizedPath === "/evaluation" ? Evaluation : Home;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
