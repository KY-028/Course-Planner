import React from 'react'
import { Link } from "react-router-dom";

function Footer() {
    return (

        <footer class="w-full border-t-2 border-gray-300 mt-4 px-4 dark:bg-gray-800">
            <div class="w-full md:text-left text-center p-4 md:flex md:flex-row flex-col md:items-center md:justify-between justify-center">
                <span class="text-base text-gray-500 sm:text-center dark:text-gray-400">© {new Date().getFullYear}
                    <a href="https://courseplanner.com/" class="hover:underline">Course Planner</a>. All Rights Reserved.
                </span>
                <div class="flex md:justify-start justify-center md:mt-3 sm:mt-1 mt-2 md:text-base text-sm font-medium text-gray-500 dark:text-gray-400 ">
                    <Link to="/about">
                        <p class="hover:underline mx-4 md:mx-6">About</p>
                    </Link>
                    <Link to="/">
                        <p class="hover:underline mx-4 md:mx-6">Privacy Policy</p>
                    </Link>
                    <Link to="/support">
                        <p class="hover:underline ml-4 md:ml-3">Support</p>
                    </Link>
                </div>
            </div>
        </footer>
        
    )
}

export default Footer