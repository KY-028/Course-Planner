import { Children, useState } from 'react';
import "./styles.css"
import SignUp from "./pages/signUp"
import Login from "./pages/login"
import Courses from "./pages/course-selection"
import Planner from "./pages/planner"
import Home from "./pages/home"
import Footer from "./components/footer"
import Contact from "./pages/contact"
import About from './pages/about';

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
    element: <SignUp />,
  },
  {
    path: "/login",
    element: <Login />,
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
  }
]);

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;