import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  address: string;
}

const PatientSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.Patient ||
  model<IPatient>("Patient", PatientSchema);
