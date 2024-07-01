import Footer from "../components/footer";
import HomeNav from "../components/homenav";

export default function About() {
    return (
        <div className="min-h-screen flex flex-col">
            <HomeNav accountpage={false} />

            <div className="flex md:flex-row flex-col w-full items-center justify-center flex-grow">

                <div className="flex flex-col md:mt-0 mt-8 items-center px-10 w-full h-full text-center">
                    <div className='md:mt-0 mt-4'>
                        <img
                            src="/default.jpg"
                            alt="Profile"
                            className="object-cover rounded-full bg-gray-300 md:mb-4 w-32 h-32 md:w-64 md:h-64"
                        />
                    </div>
                    <h2 className="md:text-3xl text-xl font-semibold md:py-6 py-3">Kevin Yao</h2>
                    <p className="md:text-xl text-lg text-gray-800 md:mb-2">3rd Year Computing Student</p>
                    <p className="md:text-xl text-gray-800 mb-5">Fullstack Developer</p>
                    <div>
                        <a href="https://github.com/KY-028/" className="bg-blue-600 px-3 mx-2 py-2 rounded-lg text-white">GitHub</a>
                        <a href="https://www.linkedin.com/in/ky028/" className="bg-blue-600 px-3 mx-2 py-2 rounded-lg text-white">LinkedIn</a>
                    </div>
                </div>

                <div className="flex flex-col md:mt-0 mt-8  items-center px-10 w-full h-full text-center">
                    <div className='md:mt-0 mt-4'>
                        <img
                            src="/default.jpg"
                            alt="Profile"
                            className="object-cover rounded-full bg-gray-300 md:mb-4 w-32 h-32 md:w-64 md:h-64"
                        />
                    </div>
                    <h2 className="md:text-3xl text-xl font-semibold md:py-6 py-3">Bill Wei</h2>
                    <p className="md:text-xl text-lg text-gray-800 mb-2">3rd Year Computing Student</p>
                    <p className="md:text-xl text-lg text-gray-800 mb-5">Front End Developer</p>
                    <div>
                        <a href="https://github.com/icsbillwei" className="bg-blue-600 px-3 mx-2 py-2 rounded-lg text-white">GitHub</a>
                        <a href="https://www.linkedin.com/in/bill-wei1/" className="bg-blue-600 px-3 mx-2 py-2 rounded-lg text-white">LinkedIn</a>
                    </div>
                </div>

                <div className="flex flex-col md:my-0 my-8  items-center px-10 w-full h-full text-center">
                    <div className='md:mt-0 mt-4'>
                        <img
                            src="/default.jpg"
                            alt="Profile"
                            className="object-cover rounded-full bg-gray-300 md:mb-4 w-32 h-32 md:w-64 md:h-64"
                        />
                    </div>
                    <h2 className="md:text-3xl text-xl font-semibold md:py-6 py-3">Karry Huang</h2>
                    <p className="md:text-xl text-lg text-gray-800 mb-2">3rd Year Computing Student</p>
                    <p className="md:text-xl text-lg text-gray-800 mb-5">Back End Developer</p>
                    <div>
                        <a className="bg-blue-600 px-3 mx-2 py-2 rounded-lg text-white">GitHub</a>
                        <a href="https://www.linkedin.com/in/linhao-huang/" className="bg-blue-600 px-3 mx-2 py-2 rounded-lg text-white">LinkedIn</a>
                    </div>
                </div>

            </div>
            <Footer />
        </div>
    );
}