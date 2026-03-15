import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.error("Error setting cookies:", error);
          }
        },
      },
    }
  );

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

  const { data, error } = await supabase.rpc("search_todos_pgroonga", {
    p_q: q || null,
    p_tag: tag || null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("Search RPC Error:", error); // サーバーログ用にエラーを出力
    return NextResponse.json(
      {
        error: "search_failed",
        message: "検索に失敗しました。もう一度お試しください",
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