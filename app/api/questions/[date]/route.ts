// app/api/questions/[date]/route.ts (any 타입 진단용 - 파일 처리 포함)

import { NextResponse, NextRequest } from "next/server";
import path from "path"; // 파일 경로 처리를 위해 import 추가
import fs from "fs/promises"; // 파일 시스템 접근을 위해 import 추가

// 두 번째 인자 타입을 'any'로 지정 (진단 목적)
export async function GET(
  request: NextRequest,
  context: any // <--- 'any' 타입 사용
) {
  let date: string | undefined;

  try {
    // context 안에 params가 있다고 가정하고 date 값 추출 (안전하게)
    const params = context?.params;
    date = params?.date;

    console.log("Build Test (Any Type - With FS) - Extracted date:", date);

    if (!date) {
      // date 추출 실패 시 에러 응답
      console.error("Build Test (Any Type - With FS) - Failed to extract date");
      return NextResponse.json(
        { error: "Date parameter could not be extracted from context." },
        { status: 400 }
      );
    }

    // --- 파일 처리 로직 시작 ---
    const filePath = path.join(process.cwd(), "data", `${date}.json`);
    console.log("Build Test (Any Type - With FS) - File path:", filePath);

    try {
      // 파일 존재 및 접근 가능 여부 확인
      await fs.access(filePath);
      console.log("Build Test (Any Type - With FS) - File access verified.");
    } catch (accessError) {
      // 파일 접근 불가 시 (주로 존재하지 않음) 404 반환
      console.error("Build Test (Any Type - With FS) - File not found or inaccessible:", accessError);
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // 파일 내용 읽기
    const fileContent = await fs.readFile(filePath, "utf-8");
    console.log("Build Test (Any Type - With FS) - File read successfully.");

    try {
      // 파일 내용을 JSON으로 파싱
      const data = JSON.parse(fileContent);
      console.log("Build Test (Any Type - With FS) - JSON parsed successfully. Returning data.");
      // 파싱 성공 시 데이터 반환
      return NextResponse.json(data, { status: 200 });
    } catch (parseError) {
      // JSON 파싱 실패 시 500 에러 반환
      console.error("Build Test (Any Type - With FS) - Error parsing JSON file:", parseError);
      return NextResponse.json({ error: "Failed to parse JSON data." }, { status: 500 });
    }
    // --- 파일 처리 로직 끝 ---

  } catch (error: unknown) {
    // 그 외 예기치 못한 에러 발생 시 500 에러 반환
    console.error("Build Test (Any Type - With FS) - Unexpected server error:", error);
    return NextResponse.json({
         error: "An unexpected server error occurred.",
         extractedDateAttempt: date
        }, { status: 500 });
  }
}
