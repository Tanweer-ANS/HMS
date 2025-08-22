import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPatient extends Document {
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  address: string;
  dateOfBirth?: Date;
}

const PatientSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date },
  },
  { timestamps: true }
);

export default models.Patient ||
  model<IPatient>("Patient", PatientSchema);