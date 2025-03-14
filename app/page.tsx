"use client";

import { useState } from "react";
export default function Home() {
  
  return (
    <div className="flex flex-col justify-center items-center">
      <div>정보처리산업기사 최신 기출</div>
      
      {/* <div className="w-[350px] mb-2">
        <div>과목 선택</div>
        <form>
          <div><input type="radio" name="subject" value="system" /> 1과목 : 정보시스템 기반 기술 </div>
          <div><input type="radio" name="subject" value="program" /> 2과목 : 프로그래밍 언어 활용 </div>
          <div><input type="radio" name="subject" value="database" /> 3과목 : 데이터베이스 활용 </div>
        </form>
      </div>
      <div className="w-[350px]">
        <div>문제 풀기 방법 선택</div>
        <form>
          <div><input type="radio" name="mod" value="random"  /> 모의고사 (2021~2024 랜덤) </div>
          <div><input type="radio" name="mod" value="select" /> 선택년도 (지정 회차의 기출 문제) </div>
        </form>
      </div> */}
      <div className="flex justify-center w-[350px]">
        <input
          type="button"
          value="문제 풀기"
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          onClick={() => window.location.href = '/random'}
        />
      </div>
    </div>    
  );
}