// /app/api/price/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain");
  const address = searchParams.get("address");

  if (!chain || !address) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const url = new URL(`https://api.1inch.dev/price/v1.1/${chain}/${address}`);
    url.searchParams.append("currency", "USD");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ONEINCH_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch price" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
