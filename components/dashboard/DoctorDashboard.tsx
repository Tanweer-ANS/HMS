'use client';

// DoctorDashboard: Main dashboard for doctors, showing appointments, stats, profile, analytics, and patient records.
// Uses Clerk for authentication and fetches doctor/appointment data from backend APIs.

import { useState, useEffect } from 'react';
import { useUser} from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  User,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

// import DoctorOnboarding from "@/app/doctor/onboarding/page";
import DoctorProfile from './DoctorProfile';
import AnalyticsPage from "@/app/analytics/page"

// Patient and Appointment interfaces for type safety
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  dateOfBirth: string;
  gender: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  symptoms: string[];
  consultationFee: number;
  notes?: string;
  diagnosis?: string;
}

// Main DoctorDashboard component
export default function DoctorDashboard() {
  const { user } = useUser(); // Clerk user object
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // Tab navigation

  // Fetch appointments and doctor profile on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data from backend APIs
  const fetchData = async () => {
    try {
      const [appointmentsRes, doctorRes] = await Promise.all([
        fetch('/api/appointments/doctor', { cache: 'no-store' }),
        fetch('/api/doctor/profile', { cache: 'no-store' })
      ]);

      const appointmentsData = await appointmentsRes.json();
      const doctorData = await doctorRes.json();

      setAppointments(appointmentsData.appointments || []);
      setDoctorInfo(doctorRes.ok ? (doctorData.doctor || null) : null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper for appointment status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter today's appointments
  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  // Filter upcoming appointments (not cancelled, date >= today)
  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.appointmentDate) >= new Date() && apt.status !== 'Cancelled'
  ).slice(0, 5);

  // Filter completed appointments
  const completedAppointments = appointments.filter(apt =>
    apt.status === 'Completed'
  );

  // Calculate total revenue from completed appointments
  const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.consultationFee, 0);

  // Loading spinner while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Main dashboard UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header with navigation tabs and user info */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Doctor Portal branding */}
              <span className="text-sm text-gray-500">Doctor&nbsp;Portal</span>
            </div>

            {/* Tab navigation */}
            <nav className="hidden md:flex space-x-8">
              {['overview', 'appointments', 'chats', 'analytics', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* User info */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Dr. {user?.firstName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab: Welcome, stats, today's/upcoming appointments, quick actions */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, Dr.&nbsp;{user?.firstName}!
              </h1>
              <p className="text-green-100 text-lg">
                You have {todayAppointments.length} appointments scheduled for today.
              </p>
              {doctorInfo && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {doctorInfo.specialization}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {doctorInfo.experience} years experience
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Appointments */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Today</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {todayAppointments.length}
                  </div>
                  <p className="text-gray-600 text-sm">Appointments</p>
                </CardContent>
              </Card>

              {/* Total Patients */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Patients</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {doctorInfo?.totalPatients || 0}
                  </div>
                  <p className="text-gray-600 text-sm">Connect with patients.</p>
                </CardContent>
              </Card>

              {/* Completed Appointments */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span>Completed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {completedAppointments.length}
                  </div>
                  <p className="text-gray-600 text-sm">This month</p>
                </CardContent>
              </Card>

              {/* Revenue */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <span>Revenue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    ${totalRevenue}
                  </div>
                  <p className="text-gray-600 text-sm">Total earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule and Upcoming Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Today&apos;s Schedule</span>
                    <Badge variant="secondary">{todayAppointments.length} appointments</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {todayAppointments.slice(0, 4).map((appointment) => (
                        <div
                          key={appointment._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{appointment.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.appointmentTime}
                            </div>
                            <Badge className={`mt-1 ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {todayAppointments.length > 4 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab('appointments')}
                        >
                          View All Today&apos;s Appointments
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No appointments scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Upcoming Appointments</span>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('appointments')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.slice(0, 4).map((appointment) => (
                        <div
                          key={appointment._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{appointment.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">{appointment.appointmentTime}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions: Cards for navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-green-200" onClick={() => setActiveTab('appointments')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Manage Appointments</span>
                  </CardTitle>
                  <CardDescription>
                    View, update, and manage your appointment schedule
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200" onClick={() => setActiveTab('patients')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Patient Records</span>
                  </CardTitle>
                  <CardDescription>
                    Access patient information and medical history
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200" onClick={() => setActiveTab('analytics')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Practice Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    View insights and reports about your practice
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Appointments Tab: List and details of all appointments */}
        {activeTab === 'appointments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">Manage Appointments</h2>

            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {appointment.patient.firstName.charAt(0)}{appointment.patient.lastName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </h4>
                            <p className="text-gray-600">Age: {new Date().getFullYear() - new Date(appointment.patient.dateOfBirth).getFullYear()}, {appointment.patient.gender}</p>
                            <p className="text-sm text-gray-500">{appointment.reason}</p>
                            {appointment.symptoms && appointment.symptoms.length > 0 && (
                              <p className="text-sm text-gray-500">Symptoms: {appointment.symptoms.join(', ')}</p>
                            )}
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
                          <div className="text-sm text-green-600 font-medium mt-1">
                            ${appointment.consultationFee}
                          </div>
                        </div>
                      </div>
                      {(appointment.notes || appointment.diagnosis) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {appointment.diagnosis && (
                            <p className="text-sm"><strong>Diagnosis:</strong> {appointment.diagnosis}</p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {appointment.notes}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
                  <p className="text-gray-600">Your appointments will appear here once patients start booking</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Profile Tab: Doctor profile info */}
        {activeTab === "profile" && (
          <DoctorProfile />
        )}

        {/* Chats Tab: Placeholder for future chat functionality */}
        {/* {activeTab === "chats" && ()} */}

        {/* Analytics Tab: Practice analytics and reports */}
        {activeTab === "analytics" && (
          <AnalyticsPage />
        )}
      </div>
    </div>
  );
}

// Doctor interface for doctorInfo state
interface Doctor {
  specialization?: string;
  experience?: number;
  totalPatients?: number;
  profileCompleted?: boolean;
  // Add other fields as needed
}