import path from "path";
import fs from "fs/promises";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } } // Next.js 15에서 요구하는 정확한 타입
) {
  try {
    if (!params.date) {
      return NextResponse.json(
        { error: "Date parameter is missing." },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "data", `${params.date}.json`);

    try {
      await fs.access(filePath); // 파일 존재 여부 확인
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
