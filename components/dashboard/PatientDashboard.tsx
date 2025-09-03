'use client';

// Import necessary React hooks and components from various libraries.
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
// UI components from a custom components library.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Icons from lucide-react.
import { Calendar, Clock, User, Stethoscope, Plus, Search, Filter, Star } from 'lucide-react';
// Animation library for smooth transitions.
import { motion } from 'framer-motion';
import Link from "next/link";
// Custom components for different parts of the dashboard.
import PatientProfile from './PatientProfile';
import PaymentMethodSelector from '../PaymentMethodSelector';

// Defines the TypeScript interface for a Doctor object, ensuring type safety.
interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  experience: number;
  qualification: string;
  consultationFee: number;
  rating: number;
  totalPatients: number;
  biography: string;
  availableSlots: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

// Defines the TypeScript interface for an Appointment object.
interface Appointment {
  _id: string;
  doctor: Doctor; // Embeds the Doctor interface as a nested object.
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  consultationFee: number;
}

// The main component for the patient's dashboard.
export default function PatientDashboard() {
  // Use the useUser hook from Clerk to get the authenticated user's details.
  const { user } = useUser();
  
  // State variables using the useState hook to manage the component's data and UI state.
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  // Controls which view (tab) is currently displayed to the user.
  const [activeTab, setActiveTab] = useState('overview');
  // Boolean state to control the visibility of the appointment booking modal.
  const [showBookingModal, setShowBookingModal] = useState(false);
  // Boolean state to control the visibility of the payment modal within the booking flow.
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // Stores the details of the doctor selected by the user for booking.
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  // Stores the data entered by the user in the booking form.
  const [bookingData, setBookingData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });

  // The useEffect hook runs a side effect (data fetching) after the component mounts.
  // The empty dependency array `[]` ensures it only runs once.
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Asynchronous function to fetch patient appointments and the list of all doctors.
   * It makes two API calls concurrently using `Promise.all` for better performance.
   */
  const fetchData = async () => {
    try {
      setLoading(true); // Start the loading state.
      // Use Promise.all to fetch both datasets simultaneously.
      const [appointmentsRes, doctorsRes] = await Promise.all([
        fetch('/api/appointments/patient'),
        fetch('/api/doctors')
      ]);

      // Parse the JSON responses.
      const appointmentsData = await appointmentsRes.json();
      const doctorsData = await doctorsRes.json();

      // Update the state with the fetched data, handling potential empty responses.
      setAppointments(appointmentsData.appointments || []);
      setDoctors(doctorsData.doctors || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      // Set loading to false once fetching is complete, regardless of success or failure.
      setLoading(false);
    }
  };

  /**
   * Handles the click event when a user wants to book an appointment with a doctor.
   * It finds the doctor by ID and sets the state to display the booking modal.
   * @param {string} doctorId - The unique ID of the doctor.
   */
  const handleBookAppointment = (doctorId: string) => {
    const doctor = doctors.find(d => d._id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setShowBookingModal(true);
    }
  };

  /**
   * Asynchronous function to submit the booking form data to the server.
   * This is triggered when the user confirms their booking details.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      // Send a POST request to the API with the booking details.
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Stringify the booking data to send it in the request body.
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          appointmentDate: bookingData.appointmentDate,
          appointmentTime: bookingData.appointmentTime,
          reason: bookingData.reason,
          consultationFee: selectedDoctor.consultationFee
        }),
      });

      const result = await response.json();
      
      // Check if the booking was successful based on the API response.
      if (result.success) {
        // Close the modals and reset the state after a successful booking.
        setShowBookingModal(false);
        setSelectedDoctor(null);
        setBookingData({ appointmentDate: '', appointmentTime: '', reason: '' });
        // Re-fetch data to update the appointments list on the dashboard.
        fetchData();
        alert('Appointment booked successfully!');
      } else {
        alert(result.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
    }
  };

  /**
   * A helper function to return the correct Tailwind CSS class for a badge based on the appointment's status.
   * This provides a simple way to apply different colors for different statuses.
   * @param {string} status - The status of the appointment.
   * @returns {string} The Tailwind CSS class string.
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filters the full appointments list to get the three most recent upcoming appointments.
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) >= new Date() && apt.status !== 'Cancelled'
  ).slice(0, 3);

  // Filters the full appointments list to get the three most recent completed appointments.
  const recentAppointments = appointments.filter(apt => 
    apt.status === 'Completed'
  ).slice(0, 3);

  // Displays a loading spinner while the initial data fetch is in progress.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* The dashboard's main header with navigation tabs and user information. */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
          {/* Renders navigation buttons dynamically based on the available tabs. */}
            <nav className="hidden md:flex space-x-8">
              {['overview', 'doctors', 'profile', 'chat'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-100 text-blue-700' // Active tab styling.
                      : 'text-gray-500 hover:text-gray-700' // Inactive tab styling.
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Conditional rendering of different sections based on the active tab. */}
        {activeTab === 'overview' && (
          // Uses Framer Motion for a fade-in animation.
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* A welcoming banner that greets the user by name. */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName}!
              </h1>
              <p className="text-blue-100 text-lg">
                Your health journey continues. Let&apos;s make today count.
              </p>
            </div>

            {/* A grid of cards displaying quick statistics. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Upcoming</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {upcomingAppointments.length}
                  </div>
                  <p className="text-gray-600 text-sm">Appointments scheduled</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Completed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {recentAppointments.length}
                  </div>
                  <p className="text-gray-600 text-sm">Recent visits</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5 text-purple-600" />
                    <span>Doctors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {doctors.length}
                  </div>
                  <p className="text-gray-600 text-sm">Available providers</p>
                </CardContent>
              </Card>
            </div>

            {/* Card for displaying upcoming appointments. */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Upcoming appointments</span>
                  <Button 
                    size="sm" 
                    onClick={() => setActiveTab('appointments')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Renders a list of appointments if they exist, otherwise shows a call-to-action message. */}
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">{appointment.doctor.specialization}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">{appointment.appointmentTime}</div>
                          <Badge className={`mt-1 ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming appointments</p>
                    <Button 
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveTab('doctors')}
                    >
                      Book Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick action buttons to navigate to other sections. */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('doctors')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    <span>Book New Appointment</span>
                  </CardTitle>
                  <CardDescription>
                    Find and book appointments with our healthcare providers
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('appointments')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>View Medical History</span>
                  </CardTitle>
                  <CardDescription>
                    Access your complete appointment and medical history
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* A link to a future analytics page. */}
              <Link href="/analytics" passHref>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Stethoscope className="h-5 w-5 text-orange-600" />
                      <span>Analyse Your Report</span>
                    </CardTitle>
                    <CardDescription>
                      Get AI-powered insights on your medical reports (coming soon)
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </motion.div>
        )}

        {/* 'Find a Doctor' section. */}
        {activeTab === 'doctors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Find a Doctor</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Maps over the doctors array to render a Card for each doctor. */}
              {doctors.map((doctor) => (
                <Card key={doctor._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                      {/* Displays the doctor's initials. */}
                      {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                    </div>
                    <CardTitle className="text-xl">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {doctor.specialization} • {doctor.experience} years experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Qualification</span>
                      <span className="font-medium">{doctor.qualification}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Consultation Fee</span>
                      <span className="font-medium text-green-600">${doctor.consultationFee}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{doctor.rating || 'New'}</span>
                      <span className="text-sm text-gray-600">
                        ({doctor.totalPatients} patients)
                      </span>
                    </div>
                    {doctor.biography && (
                      <p className="text-sm text-gray-600 line-clamp-3">{doctor.biography}</p>
                    )}
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleBookAppointment(doctor._id)} // Triggers the booking process.
                    >
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* 'My Appointments' section. */}
        {activeTab === 'appointments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
            
            <div className="space-y-4">
              {appointments.length > 0 ? (
                // Renders a list of all appointments.
                appointments.map((appointment) => (
                  <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {appointment.doctor.firstName.charAt(0)}{appointment.doctor.lastName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                            </h4>
                            <p className="text-gray-600">{appointment.doctor.specialization}</p>
                            <p className="text-sm text-gray-500">{appointment.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-600">{appointment.appointmentTime}</div>
                          <Badge className={`mt-2 ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Displays a message and a button if no appointments are found.
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
                  <p className="text-gray-600 mb-6">Book your first appointment to get started</p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveTab('doctors')}
                  >
                    Find a Doctor
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 'Patient Profile' section, which uses a separate component. */}
        {activeTab === 'profile' && (
          <PatientProfile />
        )}

        {/* The booking modal, rendered conditionally. */}
        {showBookingModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Book Appointment with Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
              </h3>
              {/* Toggles between the booking form and the payment selector. */}
              {!showPaymentModal ? (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingData.appointmentDate}
                      onChange={(e) => setBookingData({...bookingData, appointmentDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split('T')[0]} // Prevents selecting past dates.
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <select
                      required
                      value={bookingData.appointmentTime}
                      onChange={(e) => setBookingData({...bookingData, appointmentTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select time</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Visit
                    </label>
                    <textarea
                      required
                      value={bookingData.reason}
                      onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describe your symptoms or reason for visit..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedDoctor(null);
                        setBookingData({ appointmentDate: '', appointmentTime: '', reason: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </form>
              ) : (
                // Renders the PaymentMethodSelector component when payment is initiated.
                <PaymentMethodSelector
                  doctorId={selectedDoctor._id}
                  amount={selectedDoctor.consultationFee}
                  doctorName={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                  appointmentDate={bookingData.appointmentDate}
                  appointmentTime={bookingData.appointmentTime}
                  reason={bookingData.reason}
                  onSuccess={() => {
                    // Logic to execute after a successful payment.
                    setShowPaymentModal(false);
                    setShowBookingModal(false);
                    setSelectedDoctor(null);
                    setBookingData({ appointmentDate: '', appointmentTime: '', reason: '' });
                    fetchData();
                  }}
                  onCancel={() => setShowPaymentModal(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}