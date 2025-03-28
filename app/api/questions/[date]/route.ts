// app/api/questions/[date]/route.ts

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

// --- 시그니처 수정 ---
// 두 번째 인자를 'context' 같은 이름으로 받고, 그 타입을 지정합니다.
// context 객체 안에 params 속성이 있고, 그 안에 date가 있는 구조입니다.
export async function GET(
  request: NextRequest,
  context: { params: { date: string } } // <--- 이렇게 수정
) {
  try {
    // context 객체에서 params를 추출합니다.
    const params = context.params; // <--- 추가된 부분
    console.log("Build Test - Extracted params object:", params);

    // params 객체에서 date 값을 접근합니다. (이제 params는 { date: '...' } 형태)
    const date = params.date; // <--- 이 부분은 그대로 유지
    console.log("Build Test - Extracted date:", date);

    if (!date) {
      // params가 context.params에서 제대로 추출되었다면 이 경우는 거의 없음
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
        // console.log("Corrected - Returning data:", data); // 빌드 시 불필요한 로그는 제거하는 것이 좋음
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
