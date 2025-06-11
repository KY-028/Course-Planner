import HomeNav from "../components/homenav";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function Privacy() {

    return (
        <>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
                </div>
                
                <div className="bg-white shadow rounded-lg p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Security</h2>
                        <p className="text-gray-600">
                            Your privacy and security are important to us. All passwords are securely hashed and protected. 
                            We implement industry-standard security measures and utilize major cloud providers (e.g. AWS, Google Cloud) to protect your information.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Course Data</h2>
                        <p className="text-gray-600">
                            While using our course selection and planner features, we temporarily store the list of courses 
                            you add to help provide our service. This information is only used to power the functionality 
                            of the website and is not used for any other purposes. If you prefer not to have your course selections stored, you can remove all courses before 
                            logging off. This will ensure no course data is retained in your account.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Disclaimer</h2>
                        <p className="text-gray-600">
                            This is a student-developed tool and is in no way associated with official data from Queen's. We do not guarantee that the time table times are accurate and the plan requirements filling condition is correctly displayed/calculated because there may be a lot of exceptions that are unique to each student.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact Us</h2>
                        <p className="text-gray-600">
                            If you have any questions about our privacy policy or how we handle your data, 
                            please don't hesitate to contact us through our <Link to="/contact">contact page</Link>.
                        </p>
                    </div>

                    <div className="flex justify-center space-x-4 pt-6">
                        <Link to="/">
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Back to Home
                            </button>
                        </Link>
                        <Link to="/course-selection">
                            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                Go to Dashboard
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}