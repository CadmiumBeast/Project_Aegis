

// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Auth from "./components/auth/Auth";
// import ResponderForm from "./components/responder/ResponderForm";
// import PastReports from "./components/responder/PastReports";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Auth />} />
//         <Route path="/responder-form" element={<ResponderForm />} />
//         <Route path="/past-reports" element={<PastReports />} />
//       </Routes>
//     </Router>
//   );
// }

// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Auth from "./components/auth/Auth";
// import SplashScreen from "./components/SplashScreen";
// import ResponderForm from "./components/responder/ResponderForm";
// import PastReports from "./components/responder/PastReports";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Auth />} />
//         <Route path="/responder-form" element={<ResponderForm />} />
//         <Route path="/past-reports" element={<PastReports />} />
//       </Routes>
//     </Router>
//   );
// }

// // Make sure to export default
// export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/auth/Auth";
import SplashScreen from "./components/SplashScreen"; 
import ResponderForm from "./components/responder/ResponderForm";
import PastReports from "./components/responder/PastReports";
import PendingReports from "./components/responder/PendingReports";

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<SplashScreen />} />
<Route path="/auth" element={<Auth />} />
<Route path="/responder-form" element={<ResponderForm />} />
<Route path="/past-reports" element={<PastReports />} />
<Route path="/pending-reports" element={<PendingReports />} />

      </Routes>
    </Router>
  );
}

// Make sure to export default
export default App;