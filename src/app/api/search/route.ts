import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/server";

type Todo = {
  id: string;
  title: string;
  tags: string[];
  likes: number;
  user_id: string;
  created_at: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";

  if (!q) {
    return NextResponse.json(
      { error: "missing_query", message: "q パラメータが必要です" },
      { status: 400 }
    );
  }

  if (q.length > 200) {
    return NextResponse.json(
      { error: "query_too_long", message: "検索パターンは200文字以内にしてください" },
      { status: 400 }
    );
  }

  let regex: RegExp;
  try {
    regex = new RegExp(q, "i");
  } catch {
    return NextResponse.json(
      { error: "invalid_regex", message: "無効な正規表現パターンです" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("todos")
    .select("id, title, tags, likes, user_id, created_at");

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "データ取得に失敗しました" },
      { status: 500 }
    );
  }

  const todos: Todo[] = data ?? [];

  const results = todos.filter(
    (todo) =>
      regex.test(todo.title) ||
      (todo.tags ?? []).some((tag) => regex.test(tag))
  );

  return NextResponse.json({ results, total: results.length });
}
