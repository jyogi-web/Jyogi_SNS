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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const limit = clamp(Number(searchParams.get("limit") ?? 50), 1, 201);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

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

  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    return NextResponse.json(
      { error: "invalid_pagination", message: "limit / offset は数値で指定してください" },
      { status: 400 }
    );
  }

  // q が指定されている場合のみ正規表現をバリデーション
  if (q) {
    try {
      new RegExp(q, "i");
    } catch {
      return NextResponse.json(
        { error: "invalid_regex", message: "無効な正規表現パターンです" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin.rpc("search_todos_regex", {
    p_q: q || null,
    p_tag: tag || null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return NextResponse.json(
      {
        error: "db_error",
        message:
          "DB検索に失敗しました。search_todos_regex 関数が未作成の場合は docs/create_tables.sql の関数定義を実行してください",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const results: Todo[] = data ?? [];

  return NextResponse.json({
    results,
    total: results.length,
    limit,
    offset,
  });
}
