import path from "path";
import fs from "fs/promises";
import { NextResponse, NextRequest } from "next/server";
import { ParsedUrlQuery } from "querystring"; // 추가

interface Context {
  params: ParsedUrlQuery; // Next.js가 요구하는 타입 사용
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const date = context.params?.date as string | undefined; // 타입 변환

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
