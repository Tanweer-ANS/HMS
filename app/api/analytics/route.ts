import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }


        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64ImageData = buffer.toString("base64");


        const model = genAI.getGenerativeModel({
            model: "gemini-pro-vision",
        });


        const prompt = "Analyze the medical report image. Identify key information such as patient name, report date, and any significant findings or diagnosis. Summarize the content in a clear, concise manner.";


        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64ImageData,
                    mimeType: file.type,
                },
            },
        ]);

        
        const summary = result.response.text();

        
        return NextResponse.json({ summary });

    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "An error occurred during analysis." }, { status: 500 });
    }
}