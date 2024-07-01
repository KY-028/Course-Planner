import React, { useRef } from 'react'
import HomeNav from '/src/components/homenav'
import backgroundImage from '/src/assets/bg-1.png'
import emailjs from '@emailjs/browser'

const Contact = () => {
    const form = useRef();

    // email handling
    const handleSubmit = (e) => {
        e.preventDefault();
        emailjs.sendForm('service_cfmmnlp', 'template_fmvts7a', form.current, '2qeaMXLo7xFUpCTe0')
            .then(
                (result) => {
                    alert("We've received your message!");
                },
                (error) => {
                    alert(`There was an error: ${error.text}`);
                },
            )
    }

    return (
        <>
            <HomeNav accountpage={false} />

            <div style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', paddingTop: '20vh', paddingBottom: '40vh' }}>
                <div class="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
                    <h2 class="mb-4 text-4xl tracking-tight font-extrabold text-center text-white">Contact Us</h2>
                    <p class="mb-8 lg:mb-16 font-light text-center text-gray-400 sm:text-xl">See a technical issue or bug? Want to send feedback about a beta feature? Report incorrect infos in the system? Let us know!</p>
                    <form ref={form} onSubmit={handleSubmit} class="space-y-8">
                        <div>
                            <label for="email" class="block mb-2 text-sm font-medium  text-gray-400">Your email</label>
                            <input name="user_email" type="email" id="email" class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 " placeholder="name@email.com" required />
                        </div>
                        <div>
                            <label for="subject" class="block mb-2 text-sm font-medium  text-gray-400">Subject</label>
                            <input name="subject" type="text" id="subject" class="block p-3 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Let us know how we can help you" required />
                        </div>
                        <div class="sm:col-span-2">
                            <label for="message" class="block mb-2 text-sm font-medium text-gray-400">Your message</label>
                            <textarea name="message" id="message" rows="6" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg shadow-sm border border-gray-300 focus:ring-primary-500 focus:border-primary-500" placeholder="Leave a comment..."></textarea>
                        </div>
                        <button type="submit" class="py-3 px-5 text-md font-medium text-center text-white rounded-lg bg-gray-600 sm:w-fit hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-300">Send message</button>
                    </form>
                </div>
            </div>

        </>
    )
}

export default Contact