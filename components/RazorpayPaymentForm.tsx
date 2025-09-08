'use client';

// Import necessary React hooks and components
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CreditCard } from 'lucide-react';

// Extend the global Window interface to include Razorpay, as it's loaded dynamically
declare global {
  interface Window {
    Razorpay: new (options: unknown) => { open: () => void };
  }
}

// Define the component's props with TypeScript for type safety
interface RazorpayPaymentFormProps {
  doctorId: string;
  amount: number;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Main RazorpayPaymentForm component
export default function RazorpayPaymentForm({
  doctorId,
  amount,
  doctorName,
  appointmentDate,
  appointmentTime,
  reason,
  onSuccess,
  onCancel,
}: RazorpayPaymentFormProps) {
  // State to manage component loading status, order data, and errors
  const [loading, setLoading] = useState(false);
  interface CreatedOrderData {
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
  }
  const [orderData, setOrderData] = useState<CreatedOrderData | null>(null); // Stores the Razorpay order details from the backend
  const [error, setError] = useState<string | null>(null);

  // Asynchronous function to create a Razorpay order via the API
  const createOrder = useCallback(async (): Promise<void> => {
    try {
      setLoading(true); // Start loading state
      setError(null); // Clear any previous errors

      // Fetch call to the backend API to create a new Razorpay order
      const response = await fetch('/api/payments/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId,
          appointmentDate,
          appointmentTime,
          reason,
          consultationFee: amount, // Pass the appointment amount
        }),
      });

      // Handle non-OK responses from the API
      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      // Parse the JSON response and store the order data
      const data = await response.json();
      setOrderData(data as CreatedOrderData);
    } catch (err) {
      // Catch and set any errors that occur during the fetch operation
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false); // End loading state
    }
  }, [doctorId, appointmentDate, appointmentTime, reason, amount]);

  // useEffect hook to handle side effects like script loading and order creation
  useEffect(() => {
    // Dynamically create and append the Razorpay checkout script to the document body
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      // Once the script is loaded, create the payment order
      void createOrder();
    };
    script.onerror = () => {
      // If script loading fails, set an error message
      setError('Failed to load Razorpay');
    };
    document.body.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, [createOrder]); // Run on mount and when inputs to order creation change

  

  // Function to handle the payment process by opening the Razorpay payment modal
  const handlePayment = (): void => {
    // Check if order data and Razorpay script are available
    if (!orderData || !window.Razorpay) {
      setError('Payment system not ready');
      return;
    }

    // Configuration options for the Razorpay payment modal
    const options = {
      key: orderData.keyId, // The public key from the backend
      amount: orderData.amount, // The order amount in the smallest currency unit (e.g., paisa)
      currency: orderData.currency,
      name: 'HMS Healthcare',
      description: `Appointment with Dr. ${doctorName}`,
      order_id: orderData.orderId, // The order ID received from the backend
      handler: function () {
        // This function is called when the payment is successful
        onSuccess(); // Call the parent component's onSuccess function
      },
      // Optional pre-filled information for the payment form
      prefill: {
        name: 'Patient Name',
        email: 'patient@example.com',
        contact: '+91 9999999999',
      },
      notes: {
        address: 'Healthcare Management System',
      },
      theme: {
        color: '#3B82F6', // The primary color of the modal
      },
      modal: {
        ondismiss: function () {
          // This function is called when the user closes the modal
          console.log('Payment modal dismissed');
        },
      },
    };

    try {
      // Create a new Razorpay instance and open the checkout modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      // Catch and display any errors that occur when trying to open the modal
      setError('Failed to open payment form');
    }
  };

  // Conditional rendering for the loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Conditional rendering for the error state
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={createOrder}>Try Again</Button>
      </div>
    );
  }

  // Default rendering for the payment form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span>Razorpay Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appointment Summary section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Appointment Summary</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Doctor:</strong> Dr. {doctorName}</p>
            <p><strong>Date:</strong> {new Date(appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {appointmentTime}</p>
            <p><strong>Amount:</strong> ₹{amount}</p>
          </div>
        </div>

        {/* Payment information and instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Payment Details</h4>
          <p className="text-sm text-blue-700">
            You will be redirected to Razorpay&#39;s secure payment gateway to complete your payment.
          </p>
        </div>

        {/* Action Buttons for cancel and pay */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!orderData || loading} // Button is disabled until the order data is fetched
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ₹{amount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}