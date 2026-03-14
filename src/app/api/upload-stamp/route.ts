import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10GB

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_TEMP_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_TEMP_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_TEMP_SECRET_ACCESS_KEY!,
  },
});

async function getTotalStorageBytes(): Promise<number> {
  let totalBytes = 0;
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_TEMP_BUCKET_NAME,
      ContinuationToken: continuationToken,
    });
    const response = await s3.send(command);

    for (const obj of response.Contents ?? []) {
      totalBytes += obj.Size ?? 0;
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return totalBytes;
}

export async function GET() {
  try {
    const totalBytes = await getTotalStorageBytes();
    const usedGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const limitGB = (MAX_STORAGE_BYTES / (1024 * 1024 * 1024)).toFixed(0);
    return NextResponse.json({
      usedBytes: totalBytes,
      usedGB: parseFloat(usedGB),
      limitGB: parseFloat(limitGB),
      usagePercent: Math.round((totalBytes / MAX_STORAGE_BYTES) * 100),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "failed to get storage info" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const userId = form.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "file and userId required" },
        { status: 400 },
      );
    }

    // ファイルサイズ上限チェック（単体で5MB以下）
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください" },
        { status: 413 },
      );
    }

    // R2 全体ストレージ使用量チェック（10GB上限）
    const totalBytes = await getTotalStorageBytes();
    if (totalBytes + file.size > MAX_STORAGE_BYTES) {
      return NextResponse.json(
        { error: "ストレージ容量が上限（10GB）に達しています" },
        { status: 507 },
      );
    }

    const now = new Date();
    const ymd = now
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const key = `stamps/${userId}_${ymd}.jpg`;

    const arrayBuffer = await file.arrayBuffer();
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_TEMP_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: "image/jpeg",
      }),
    );

    const imageUrl = `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${key}`;
    return NextResponse.json({ imageUrl, key });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "upload failed" },
      { status: 500 },
    );
  }
}
