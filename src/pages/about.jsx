import Footer from "../components/footer";
import HomeNav from "../components/homenav";

export default function About() {
    return (
        <>
            <HomeNav />
            <div className="mx-2 h-screen">
                Can you believe this is a project rushed in less than a week?<br></br>We're sorry that we got No Time for an About Page Yet! <br></br>But since you found this page I just want to say please double check your inputs to prevent from crashing ;&#40;
                <br></br>And sorry your information are all lost when you refresh, we're working on it!<br></br>--Kevin, Karry, Bill
            </div>
            <Footer />
        </>
    );
}