import React from 'react'
import HomeNav from '/src/components/homenav'
import backgroundImage from '/src/assets/bg-1.png'
import { Link } from 'react-router-dom'

const Home = () => {
    return (
        <>
            <HomeNav accountpage={false} />

            <div className="flex flex-col lg:flex-row justify-center items-center h-screen text-white"
                style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="text-center lg:text-left lg:flex-1 p-5 lg:ml-20">
                    <h1 className=" lg:max-w-screen-sm-custom text-xl lg:text-4xl font-bold overflow-hidden border-r-2 border-white whitespace-nowrap"
                        style={{
                            animation: `typing 1.5s steps(60, end), blink-caret .75s step-end infinite`,
                            // maxWidth: '700px' 
                        }}>
                        Committed to Your Academic Journey
                    </h1>
                    <p className="text-base lg:text-xl mt-5 text-gray-400 font-light fade-in"
                        style={{
                            opacity: 0,
                            animation: `fadeIn 1s ease-out forwards`,
                            animationDelay: '1.5s'
                        }}>
                        Streamline Your Course Selection and Graduation Path at Queen's<br />Made with ❤️ by Queen's students.
                    </p>
                    <Link to="/course-selection" className="mt-10 text-sm lg:text-xl px-8 py-3 bg-blue-500 text-white rounded-xl inline-block transition duration-300 hover:bg-blue-600 hover:scale-105"
                        style={{
                            opacity: 0,
                            animation: `fadeIn 1s ease-out forwards`,
                            animationDelay: '2.2s',
                        }}>
                        Try the Course Selection Planner
                    </Link>
                </div>
                <div className="lg:w-1/2 sm:w-full flex justify-center items-center text-2xl text-gray-400 rounded-full mt-0 lg:mt-0 lg:h-auto">
                    <img src={"./demo.png"} alt="icon" className="lg:w-auto lg:h-auto w-[80%] sm:h-full mr-2"
                        style={{
                            opacity: 0,
                            animation: `flyInFromRight 1s ease-out forwards`,
                            animationDelay: '2.2s'
                        }} />
                </div>
            </div>


        </>
    )
}

export default Home