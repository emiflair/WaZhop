import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container-custom py-16">
        <h1 className="text-4xl font-bold mb-6">About WaShop</h1>
        <div className="prose max-w-none">
          <p className="text-lg text-gray-600 mb-4">
            WaShop is Nigeria's leading WhatsApp shop builder, empowering small businesses and 
            individual sellers to create beautiful online storefronts in minutes.
          </p>
          <p className="text-gray-600">
            Our mission is to make e-commerce accessible to everyone by leveraging WhatsApp, 
            the communication platform Nigerians trust and use every day.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
