import path from "path";
import fs from "fs/promises";
import { NextResponse, NextRequest } from "next/server";

interface Params {
  date?: string;
}

interface Context {
  params: Params;
}

export async function GET(
  request: NextRequest,
  context: Context // ✅ 명시적인 Context 타입 사용
) {
  try {
    const { date } = context.params;

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is missing." },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "data", `${date}.json`);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "Failed to read data." }, { status: 500 });
  }
}
