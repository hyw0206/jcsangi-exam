// app/api/questions/[date]/route.ts

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

// --- 시그니처 수정 (더 일반적인 타입 사용) ---
export async function GET(
  request: NextRequest,
  // context의 params 타입을 Record<string, string | string[]>로 변경
  context: { params: Record<string, string | string[]> }
) {
  try {
    const params = context.params;
    console.log("Build Test (Generic Type) - Extracted params object:", params);

    // params.date 접근 시 string으로 타입 단언(as string) 필요할 수 있음
    const date = params.date as string;
    console.log("Build Test (Generic Type) - Extracted date:", date);

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter could not be extracted." },
        { status: 400 }
      );
    }

    // --- 이하 파일 처리 로직은 동일 ---
    const filePath = path.join(process.cwd(), "data", `${date}.json`);
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    const fileContent = await fs.readFile(filePath, "utf-8");
    try {
        const data = JSON.parse(fileContent);
        return NextResponse.json(data, { status: 200 });
    } catch (parseError) {
        console.error("Error parsing JSON file:", parseError);
        return NextResponse.json({ error: "Failed to parse JSON data." }, { status: 500 });
    }

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
