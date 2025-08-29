import mongoose, { Schema, Document, models, model } from "mongoose";

interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface IMedicalHistory {
  allergies: string[];
  conditions: string[];
  medications: string[];
}

export interface IPatient extends Document {
  clerkId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  dateOfBirth: Date;
  address: IAddress;
  emergencyContact: IEmergencyContact;
  medicalHistory: IMedicalHistory;
}

const PatientSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    phone: { type: String },
    email: { type: String },
    dateOfBirth: { type: Date },
    address: { 
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String }
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String }
    },
    medicalHistory: {
      allergies: [{ type: String }],
      conditions: [{ type: String }],
      medications: [{ type: String }]
    }
  },
  { timestamps: true }
);

export default models.Patient ||
  model<IPatient>("Patient", PatientSchema);
