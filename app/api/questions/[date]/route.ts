
import { NextResponse, NextRequest } from "next/server";
import path from "path"; 
import fs from "fs/promises"; 

export async function GET(
  request: NextRequest,
  context: any
) {
  let date: string | undefined;

  try {
    const params = context?.params;
    date = params?.date;

    console.log("Build Test (Any Type - With FS) - Extracted date:", date);

    if (!date) {
      console.error("Build Test (Any Type - With FS) - Failed to extract date");
      return NextResponse.json(
        { error: "Date parameter could not be extracted from context." },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "data", `${date}.json`);

    try {
      await fs.access(filePath);
    } catch (accessError) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const fileContent = await fs.readFile(filePath, "utf-8");

    try {
      const data = JSON.parse(fileContent);
      return NextResponse.json(data, { status: 200 });
    } catch (parseError) {
      return NextResponse.json({ error: "Failed to parse JSON data." }, { status: 500 });
    }

  } catch (error: unknown) {
    return NextResponse.json({
         error: "An unexpected server error occurred.",
         extractedDateAttempt: date
        }, { status: 500 });
  }
}
