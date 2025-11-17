import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { FaCreditCard } from 'react-icons/fa';

const FlutterwavePayment = ({ 
  amount, 
  email, 
  name, 
  phone,
  planName,
  billingPeriod,
  onSuccess, 
  onClose,
  children 
}) => {
  // Debug: Log the public key to see what's being used
  const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
  console.log('🔑 Flutterwave Public Key:', publicKey);
  console.log('🔑 Key type:', typeof publicKey);
  console.log('🔑 Key length:', publicKey?.length);
  console.log('🔑 All env vars:', import.meta.env);
  
  const config = {
    public_key: publicKey,
    tx_ref: `WZ-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: email,
      phone_number: phone || '',
      name: name,
    },
    customizations: {
      title: 'WaZhop Subscription',
      description: `${planName} Plan - ${billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}`,
      logo: 'https://res.cloudinary.com/your-cloud/image/upload/v1/wazhop-logo.png',
    },
    meta: {
      plan: planName.toLowerCase(),
      billingPeriod: billingPeriod,
      user_email: email,
    },
  };
  
  console.log('💳 Full Flutterwave Config:', config);

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    handleFlutterPayment({
      callback: (response) => {
        console.log('Flutterwave payment response:', response);
        closePaymentModal();
        
        if (response.status === 'successful' || response.status === 'completed') {
          // Immediately call success handler - this will verify and activate the plan
          onSuccess({
            transactionId: response.transaction_id,
            txRef: response.tx_ref,
            amount: response.amount,
            currency: response.currency,
            paymentType: response.payment_type,
            status: response.status,
          });
        } else if (response.status === 'cancelled') {
          onClose({ cancelled: true });
        } else {
          // Payment failed
          onClose({ failed: true, response });
        }
      },
      onClose: () => {
        console.log('Payment modal closed by user');
        onClose({ cancelled: true });
      },
    });
  };

  // If children are provided, render them as the trigger button
  if (children) {
    return (
      <div onClick={handlePayment}>
        {children}
      </div>
    );
  }

  // Default button
  return (
    <button
      onClick={handlePayment}
      className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
    >
      <FaCreditCard />
      <span>Pay ₦{amount.toLocaleString()}</span>
    </button>
  );
};

export default FlutterwavePayment;
