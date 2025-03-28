// app/api/questions/[date]/route.ts

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

// --- 여기가 가장 중요합니다! ---
// 두 번째 인자를 { params } 형태로 구조 분해 할당해야 합니다.
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } } // <--- 이 시그니처가 맞는지 확인하세요!
) {
  try {
    // 이제 이 위치에서 params는 { date: '2022-1' } 같은 객체입니다.
    console.log("Corrected - params object:", params); // 이제 { date: '...' } 형태가 출력될 것입니다.

    // 따라서 params.date 접근이 정상적으로 동작합니다.
    const date = params.date;

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
    try {
        const data = JSON.parse(fileContent);
        console.log("Corrected - Returning data:", data); // 실제 데이터 로깅 (선택 사항)
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