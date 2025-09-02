'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Edit, 
  Save, 
  X,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Doctor {
  _id?: string;
  clerkId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  specialization?: string;
  experience?: number;
  qualification?: string;
  contactNumber?: string;
  consultationFee?: number;
  availableSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  biography?: string;
  rating?: number;
  totalPatients?: number;
  profileCompleted?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function DoctorProfile() {
  const { user } = useUser();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    qualification: '',
    contactNumber: '',
    consultationFee: '',
    biography: '',
    availableSlots: [] as Array<{ day: string; startTime: string; endTime: string }>,
  });

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const res = await fetch('/api/doctor/profile', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.doctor) {
        setDoctor(data.doctor);
        setFormData({
          specialization: data.doctor.specialization || '',
          experience: data.doctor.experience?.toString() || '',
          qualification: data.doctor.qualification || '',
          contactNumber: data.doctor.contactNumber || '',
          consultationFee: data.doctor.consultationFee?.toString() || '',
          biography: data.doctor.biography || '',
          availableSlots: data.doctor.availableSlots || [],
        });
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    const existingSlotIndex = formData.availableSlots.findIndex(slot => slot.day === day);

    if (existingSlotIndex >= 0) {
      const updatedSlots = [...formData.availableSlots];
      updatedSlots[existingSlotIndex] = {
        ...updatedSlots[existingSlotIndex],
        [field]: value,
      };
      setFormData(prev => ({ ...prev, availableSlots: updatedSlots }));
    } else {
      const newSlot = { day, startTime: '', endTime: '', [field]: value };
      setFormData(prev => ({
        ...prev,
        availableSlots: [...prev.availableSlots, newSlot]
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          experience: parseInt(formData.experience) || 0,
          consultationFee: parseInt(formData.consultationFee) || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDoctor(result.doctor);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh the dashboard data
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage(null);
    // Reset form data to current profile
    if (doctor) {
      setFormData({
        specialization: doctor.specialization || '',
        experience: doctor.experience?.toString() || '',
        qualification: doctor.qualification || '',
        contactNumber: doctor.contactNumber || '',
        consultationFee: doctor.consultationFee?.toString() || '',
        biography: doctor.biography || '',
        availableSlots: doctor.availableSlots || [],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doctor Profile</h2>
          <p className="text-gray-600">Manage your professional information and availability</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="bg-green-600 hover:bg-green-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <p className="text-sm text-gray-900 mt-1">{doctor?.firstName || 'Not provided'}</p>
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <p className="text-sm text-gray-900 mt-1">{doctor?.lastName || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <p className="text-sm text-gray-900 mt-1">{doctor?.email || 'Not provided'}</p>
            </div>

            <div>
              <Label htmlFor="specialization">Specialization</Label>
              {editing ? (
                <Select value={formData.specialization} onValueChange={(value: string) => setFormData({ ...formData, specialization: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map(spec => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1">{doctor?.specialization || 'Not provided'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                {editing ? (
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 5"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.experience || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                {editing ? (
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g., MBBS, MD"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.qualification || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                {editing ? (
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.contactNumber || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="consultationFee">Consultation Fee (USD)</Label>
                {editing ? (
                  <Input
                    id="consultationFee"
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
                    placeholder="100"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">${doctor?.consultationFee || 'Not provided'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <span>Biography</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={formData.biography}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
                placeholder="Tell patients about yourself, your approach to healthcare, and your experience..."
                rows={6}
              />
            ) : (
              <p className="text-sm text-gray-900">{doctor?.biography || 'No biography provided'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span>Available Time Slots</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map((day) => {
              const slot = formData.availableSlots.find(s => s.day === day);
              return (
                <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                  <div className="font-medium">{day}</div>
                  <div>
                    {editing ? (
                      <Select
                        value={slot?.startTime || ''}
                        onValueChange={(value: string) => handleSlotChange(day, 'startTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-600">{slot?.startTime || 'Not set'}</span>
                    )}
                  </div>
                  <div>
                    {editing ? (
                      <Select
                        value={slot?.endTime || ''}
                        onValueChange={(value: string) => handleSlotChange(day, 'endTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-600">{slot?.endTime || 'Not set'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {editing && (
        <div className="flex justify-end space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
