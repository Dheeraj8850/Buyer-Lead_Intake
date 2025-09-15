import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buyerCreateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

// temporary hardcoded owner (replace with auth later)
const CURRENT_OWNER = "demo-owner";

// ✅ Get all buyers (ordered by updatedAt desc)
export async function GET() {
  const buyers = await prisma.buyer.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(buyers);
}

// ✅ Create a new buyer
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // validate incoming payload
    const parsed = buyerCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.format() },
        { status: 422 }
      );
    }
    const payload = parsed.data;

    // tags stored as CSV in SQLite
    const tagsStored =
      payload.tags && payload.tags.length ? payload.tags.join(",") : "";

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.buyer.create({
        data: {
          fullName: payload.fullName,
          email: payload.email ?? null,
          phone: payload.phone,
          city: payload.city,
          propertyType: payload.propertyType,
          bhk: payload.bhk ?? null,
          purpose: payload.purpose,
          budgetMin: payload.budgetMin ?? null,
          budgetMax: payload.budgetMax ?? null,
          timeline: payload.timeline,
          source: payload.source,
          status: "New",
          notes: payload.notes ?? null,
          tags: tagsStored,
          ownerId: CURRENT_OWNER,
        },
      });

      await tx.buyerHistory.create({
        data: {
          buyerId: created.id,
          changedBy: CURRENT_OWNER,
          diff: { created: JSON.parse(JSON.stringify(created)) } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
