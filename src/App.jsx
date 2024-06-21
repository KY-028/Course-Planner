import { Children, useState } from 'react';
import "./styles.css"
import LeftMenu from "./components/leftMenu"
import SignUp from "./pages/signUp"
import Login from "./pages/login"
import Home from "./pages/home"
import Footer from "./components/footer"

import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";

// layout for commen page
function Layout() {
  return (
    <>
      <LeftMenu activeTab={'home'}/>
      <Outlet/>
      <Footer/>
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
      }
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
]);

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <RouterProvider router={router}/>
    </div>
  );
}

export default App;