import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FiltersPage from "./pages/FiltersPage";
import ResultsPage from "./pages/ResultsPage";
import "./styles.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FiltersPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
