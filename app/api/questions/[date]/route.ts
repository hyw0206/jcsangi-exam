import path from "path";
import fs from "fs/promises";

export async function GET(
  request: Request,
  context: { params: { date?: string } }
) {
  try {
    const params = await context.params; // ✅ params를 비동기적으로 가져오기

    if (!params?.date) {
      return new Response(
        JSON.stringify({ error: "Date parameter is missing." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const filePath = path.join(process.cwd(), "data", `${params.date}.json`);

    try {
      await fs.access(filePath);
    } catch {
      return new Response(
        JSON.stringify({ error: "File not found." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return new Response(
      JSON.stringify({ error: "Failed to read data." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
