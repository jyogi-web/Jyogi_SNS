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
  const tag = searchParams.get("tag") ?? "";

  if (!q && !tag) {
    return NextResponse.json(
      { error: "missing_query", message: "q または tag パラメータが必要です" },
      { status: 400 }
    );
  }

  if (q.length > 200 || tag.length > 200) {
    return NextResponse.json(
      { error: "query_too_long", message: "検索パターンは200文字以内にしてください" },
      { status: 400 }
    );
  }

  // q が指定されている場合のみ正規表現をコンパイル
  let regex: RegExp | null = null;
  if (q) {
    try {
      regex = new RegExp(q, "i");
    } catch {
      return NextResponse.json(
        { error: "invalid_regex", message: "無効な正規表現パターンです" },
        { status: 400 }
      );
    }
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

  const tagLower = tag.toLowerCase();

  const results = todos.filter((todo) => {
    // q が指定されていれば title または tags に regex マッチ
    const matchesQ =
      !regex ||
      regex.test(todo.title) ||
      (todo.tags ?? []).some((t) => regex!.test(t));

    // tag が指定されていれば tags[] に部分一致（AND 条件）
    const matchesTag =
      !tag ||
      (todo.tags ?? []).some((t) => t.toLowerCase().includes(tagLower));

    return matchesQ && matchesTag;
  });

  return NextResponse.json({ results, total: results.length });
}
