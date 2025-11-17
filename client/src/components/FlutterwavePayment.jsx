import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { FaCreditCard } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { paymentAPI } from '../utils/api';
import toast from 'react-hot-toast';

const FlutterwavePayment = ({ 
  amount, 
  email, 
  name, 
  phone,
  planName,
  billingPeriod,
  onSuccess, 
  onClose,
  children,
  // Payment tracking metadata
  paymentType = 'subscription', // 'subscription', 'boost', 'renewal'
  metadata = {},
  returnUrl // Where to redirect after payment
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
  const [tracking, setTracking] = useState(false);

  const trackPayment = async (status, data = {}) => {
    if (tracking) return; // Prevent duplicate tracking
    setTracking(true);
    
    try {
      await paymentAPI.updatePaymentStatus(config.tx_ref, {
        status,
        providerTransactionId: data.transactionId,
        providerResponse: data.response,
        paymentMethod: data.paymentType,
        errorMessage: data.errorMessage,
        errorCode: data.errorCode
      });
    } catch (error) {
      console.error('Failed to track payment:', error);
    } finally {
      setTracking(false);
    }
  };

  const handlePayment = async () => {
    try {
      // Track payment initiation
      await paymentAPI.initiatePayment({
        transactionRef: config.tx_ref,
        type: paymentType,
        amount: amount,
        currency: 'NGN',
        paymentProvider: 'flutterwave',
        metadata: {
          plan: planName?.toLowerCase(),
          billingPeriod: billingPeriod,
          ...metadata
        },
        returnUrl: returnUrl || window.location.href
      });
      
      toast.loading('Opening payment gateway...', { duration: 1500 });
    } catch (error) {
      console.error('Failed to track payment initiation:', error);
      // Continue anyway - tracking failure shouldn't block payment
    }

    handleFlutterPayment({
      callback: async (response) => {
        console.log('Flutterwave payment response:', response);
        closePaymentModal();
        
        if (response.status === 'successful' || response.status === 'completed') {
          // Track successful payment
          await trackPayment('successful', {
            transactionId: response.transaction_id,
            paymentType: response.payment_type,
            response: response
          });
          
          // Call success handler
          onSuccess({
            transactionId: response.transaction_id,
            txRef: response.tx_ref,
            amount: response.amount,
            currency: response.currency,
            paymentType: response.payment_type,
            status: response.status,
          });
        } else if (response.status === 'cancelled') {
          // Track cancellation
          await trackPayment('cancelled', {
            errorMessage: 'User cancelled payment'
          });
          
          onClose({ cancelled: true, returnUrl });
        } else {
          // Track failure
          await trackPayment('failed', {
            response: response,
            errorMessage: `Payment failed with status: ${response.status}`,
            errorCode: response.status
          });
          
          onClose({ failed: true, response, returnUrl });
        }
      },
      onClose: async () => {
        console.log('Payment modal closed by user');
        
        // Track cancellation
        await trackPayment('cancelled', {
          errorMessage: 'Payment modal closed without completion'
        });
        
        onClose({ cancelled: true, returnUrl });
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
