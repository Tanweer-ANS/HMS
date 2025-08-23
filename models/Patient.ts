import mongoose, { Schema, Document, models, model } from "mongoose";

interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface IPatient extends Document {
  clerkId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  address: IAddress;
}

const PatientSchema: Schema = new Schema(
  {
    clerkId:{type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number},
    gender: { type: String, enum: ["Male", "Female", "Other"]},
    phone: { type: String },
    address: { 
     street: { type: String},
     city: { type: String },
     state: { type: String },
     zipCode: { type: String }
  },
  },
  { timestamps: true }
);

export default models.Patient ||
  model<IPatient>("Patient", PatientSchema);
