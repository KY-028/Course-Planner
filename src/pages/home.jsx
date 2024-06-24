import React from 'react'
import HomeNav from '/src/components/homenav'
import backgroundImage from '/src/assets/bg-1.png'
import { Link } from 'react-router-dom'

const Home = () => {
    return (
        <>
            <HomeNav />

            <div className="flex flex-col lg:flex-row justify-center items-center h-screen text-white"
                style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="text-center lg:text-left lg:flex-1 p-5 lg:ml-20"> 
                    <h1 className="text-3xl lg:text-4xl font-semibold">Committed to Your Academic Journey</h1>
                    <p className="text-base lg:text-xl mt-5">Streamline Your Course Selection and Graduation Path at Queen's<br/>Made with ❤️ by Queen's students</p>
                    <Link to="/course-selection" className="mt-10 text-sm lg:text-xl px-5 py-2 bg-blue-500 text-white rounded inline-block"> {/* Styled as a button */}
                        Try the Course Selection Planner
                    </Link>
                </div>
                <div className="w-full lg:w-72 h-72 flex justify-center items-center text-2xl text-gray-400 rounded-full mt-5 lg:mt-0 lg:h-auto">
                    {/* Image placeholder or actual image content */}
                    Image here
                </div> 
            </div>
            
        </>
    )
}

export default Home