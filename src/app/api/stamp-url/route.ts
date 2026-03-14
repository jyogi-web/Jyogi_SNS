import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_TEMP_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_TEMP_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_TEMP_SECRET_ACCESS_KEY!,
  },
});

// GET /api/stamp-url?key=stamps/xxx.jpg
// 署名付きURL（1時間有効）を返す
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_TEMP_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return NextResponse.json({ url, expiresIn: 3600 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
