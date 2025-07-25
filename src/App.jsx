import { Children, useState } from 'react';
import "./styles.css"
import Courses from "./pages/course-selection"
import Planner from "./pages/planner"
import Home from "./pages/home"
import Footer from "./components/footer"
import Contact from "./pages/contact"
import About from './pages/about';
import LoginSignup from "./pages/loginsignup";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Privacy from './pages/privacy';

import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";

// layout for commen page
function Layout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  )
}

const router = createBrowserRouter([
  // route for home page
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/home",
        element: <Home />
      },
    ]
  },

  // route for signup and login page
  {
    path: "/signup",
    element: <LoginSignup signinintent={false} />,
  },
  {
    path: "/login",
    element: <LoginSignup signinintent={true} />,
  },
  {
    path: "/account",
    element: <LoginSignup signinintent={false} />,
  },
  {
    path: "/course-selection",
    element: <Courses />,
  },
  {
    path: "/planner",
    element: <Planner />,
  },
  {
    path: "/support",
    element: <Contact />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
]);

function App() {
  const [count, setCount] = useState(0);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div>
        <RouterProvider router={router} />
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;