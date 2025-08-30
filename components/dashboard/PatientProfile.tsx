'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 

  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PatientProfile {
  _id: string;
  clerkId: string;
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  dateOfBirth?: string;
  email?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  medicalHistory?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  phone: string;
  dateOfBirth: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: {
    allergies: string;
    conditions: string;
    medications: string;
  };
}

export default function PatientProfile() {
  const { user } = useUser();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    gender: '',
    phone: '',
    dateOfBirth: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalHistory: {
      allergies: '',
      conditions: '',
      medications: ''
    }
  });



  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/patients/profile');
      const data = await response.json();
      
      if (data.patient) {
        setProfile(data.patient);
        // Populate form data
        const patient = data.patient;
        setFormData({
          name: patient.name || '',
          age: patient.age?.toString() || '',
          gender: patient.gender || '',
          phone: patient.phone || '',
          dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
          email: patient.email || user?.emailAddresses[0]?.emailAddress || '',
          address: {
            street: patient.address?.street || '',
            city: patient.address?.city || '',
            state: patient.address?.state || '',
            zipCode: patient.address?.zipCode || ''
          },
          emergencyContact: {
            name: patient.emergencyContact?.name || '',
            phone: patient.emergencyContact?.phone || '',
            relationship: patient.emergencyContact?.relationship || ''
          },
          medicalHistory: {
            allergies: patient.medicalHistory?.allergies?.join(', ') || '',
            conditions: patient.medicalHistory?.conditions?.join(', ') || '',
            medications: patient.medicalHistory?.medications?.join(', ') || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updateData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        medicalHistory: {
          allergies: formData.medicalHistory.allergies ? formData.medicalHistory.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          conditions: formData.medicalHistory.conditions ? formData.medicalHistory.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
          medications: formData.medicalHistory.medications ? formData.medicalHistory.medications.split(',').map(s => s.trim()).filter(Boolean) : []
        }
      };

      const response = await fetch('/api/patients/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.patient);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
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
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        email: profile.email || user?.emailAddresses[0]?.emailAddress || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          zipCode: profile.address?.zipCode || ''
        },
        emergencyContact: {
          name: profile.emergencyContact?.name || '',
          phone: profile.emergencyContact?.phone || '',
          relationship: profile.emergencyContact?.relationship || ''
        },
        medicalHistory: {
          allergies: profile.medicalHistory?.allergies?.join(', ') || '',
          conditions: profile.medicalHistory?.conditions?.join(', ') || '',
          medications: profile.medicalHistory?.medications?.join(', ') || ''
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Patient Profile</h2>
          <p className="text-gray-600">Manage your personal and medical information</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700">
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
              <User className="h-5 w-5 text-blue-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{profile?.name || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                {editing ? (
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="Age"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{profile?.age || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                {editing ? (
                  <Select value={formData.gender} onValueChange={(value: 'Male' | 'Female' | 'Other') => setFormData({...formData, gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{profile?.gender || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                {editing ? (
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">
                    {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              {editing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile?.email || user?.emailAddresses[0]?.emailAddress || 'Not provided'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              {editing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile?.phone || 'Not provided'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Address Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address</Label>
              {editing ? (
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData, 
                    address: {...formData.address, street: e.target.value}
                  })}
                  placeholder="Enter street address"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile?.address?.street || 'Not provided'}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                {editing ? (
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData, 
                      address: {...formData.address, city: e.target.value}
                    })}
                    placeholder="City"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{profile?.address?.city || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                {editing ? (
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData, 
                      address: {...formData.address, state: e.target.value}
                    })}
                    placeholder="State"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{profile?.address?.state || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                {editing ? (
                  <Input
                    id="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData({
                      ...formData, 
                      address: {...formData.address, zipCode: e.target.value}
                    })}
                    placeholder="ZIP Code"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{profile?.address?.zipCode || 'Not provided'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-red-600" />
            <span>Emergency Contact</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergencyName">Contact Name</Label>
              {editing ? (
                <Input
                  id="emergencyName"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData({
                    ...formData, 
                    emergencyContact: {...formData.emergencyContact, name: e.target.value}
                  })}
                  placeholder="Emergency contact name"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile?.emergencyContact?.name || 'Not provided'}</p>
              )}
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Contact Phone</Label>
              {editing ? (
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData({
                    ...formData, 
                    emergencyContact: {...formData.emergencyContact, phone: e.target.value}
                  })}
                  placeholder="Emergency contact phone"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile?.emergencyContact?.phone || 'Not provided'}</p>
              )}
            </div>
            <div>
              <Label htmlFor="relationship">Relationship</Label>
              {editing ? (
                <Input
                  id="relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => setFormData({
                    ...formData, 
                    emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
                  })}
                  placeholder="Relationship"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile?.emergencyContact?.relationship || 'Not provided'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span>Medical History</span>
          </CardTitle>
          <CardDescription>
            Please provide any relevant medical information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="allergies">Allergies</Label>
            {editing ? (
              <Textarea
                id="allergies"
                value={formData.medicalHistory.allergies}
                onChange={(e) => setFormData({
                  ...formData, 
                  medicalHistory: {...formData.medicalHistory, allergies: e.target.value}
                })}
                placeholder="List any allergies (separate with commas)"
                rows={2}
              />
            ) : (
              <div className="mt-1">
                {profile?.medicalHistory?.allergies && profile.medicalHistory.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.medicalHistory.allergies.map((allergy, index) => (
                      <Badge key={index} variant="secondary">{allergy}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No allergies recorded</p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="conditions">Medical Conditions</Label>
            {editing ? (
              <Textarea
                id="conditions"
                value={formData.medicalHistory.conditions}
                onChange={(e) => setFormData({
                  ...formData, 
                  medicalHistory: {...formData.medicalHistory, conditions: e.target.value}
                })}
                placeholder="List any medical conditions (separate with commas)"
                rows={2}
              />
            ) : (
              <div className="mt-1">
                {profile?.medicalHistory?.conditions && profile.medicalHistory.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.medicalHistory.conditions.map((condition, index) => (
                      <Badge key={index} variant="outline">{condition}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No medical conditions recorded</p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="medications">Current Medications</Label>
            {editing ? (
              <Textarea
                id="medications"
                value={formData.medicalHistory.medications}
                onChange={(e) => setFormData({
                  ...formData, 
                  medicalHistory: {...formData.medicalHistory, medications: e.target.value}
                })}
                placeholder="List current medications (separate with commas)"
                rows={2}
              />
            ) : (
              <div className="mt-1">
                {profile?.medicalHistory?.medications && profile.medicalHistory.medications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.medicalHistory.medications.map((medication, index) => (
                      <Badge key={index} variant="default">{medication}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No medications recorded</p>
                )}
              </div>
            )}
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
