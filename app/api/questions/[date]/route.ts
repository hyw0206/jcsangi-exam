import path from "path";
import fs from "fs/promises";
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { date?: string } } // date가 없을 수도 있으므로 ? 추가
) {
  try {
    const params = await context.params; // 🔥 context.params를 await로 처리

    if (!params?.date) { // date가 없을 경우 체크
      return NextResponse.json({ error: "Date parameter is missing." }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", `${params.date}.json`);

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
