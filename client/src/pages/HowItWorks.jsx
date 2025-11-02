import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Sign Up',
      description: 'Create your free account in less than 2 minutes.',
    },
    {
      number: '2',
      title: 'Customize Your Shop',
      description: 'Choose colors, upload logo, and add your products.',
    },
    {
      number: '3',
      title: 'Share Your Link',
      description: 'Get your unique shop URL and share it everywhere.',
    },
    {
      number: '4',
      title: 'Start Selling',
      description: 'Customers browse and contact you on WhatsApp to buy.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
            How It Works
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-accent-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HowItWorks;
