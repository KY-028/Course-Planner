import React from 'react'
import { Link } from "react-router-dom";

const Footer = () => {
    return (

        <footer className="w-full border-gray-300 px-4 dark:bg-gray-800">
            <div className="w-full md:text-left text-center p-4 md:flex md:flex-row flex-col md:items-center md:justify-between justify-center">
                <span className="text-base text-gray-500 sm:text-center dark:text-gray-400">© {new Date().getFullYear}
                    <a href="https://courseplanner.ca/" className="hover:underline">Course Planner</a>. All Rights Reserved.
                </span>
                <div className="flex md:justify-start justify-center md:mt-3 sm:mt-1 mt-2 md:text-base text-sm font-medium text-gray-500 dark:text-gray-400 ">
                    <Link to="/about">
                        <p className="hover:underline mx-4 md:mx-6">About</p>
                    </Link>
                    <Link to="/">
                        <p className="hover:underline mx-4 md:mx-6">Privacy Policy</p>
                    </Link>
                    <Link to="/support">
                        <p className="hover:underline ml-4 md:ml-3">Support</p>
                    </Link>
                </div>
            </div>
        </footer>

    )
}

export default Footer