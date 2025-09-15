import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buyerCreateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

// temporary owner (replace with real auth later)
const CURRENT_OWNER = "demo-owner";

// ✅ Get one buyer
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const buyer = await prisma.buyer.findUnique({
    where: { id: params.id },
    
  });
  if (!buyer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(buyer);
}

// ✅ Update buyer
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.buyer.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ownership enforcement
    if (existing.ownerId !== CURRENT_OWNER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // partial validation
    const parsed = buyerCreateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.format() },
        { status: 422 }
      );
    }
    const payload = parsed.data;

    const tagsStored =
      payload.tags && payload.tags.length ? payload.tags.join(",") : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const buyer = await tx.buyer.update({
        where: { id: params.id },
        data: {
          ...payload,
          tags: tagsStored ?? existing.tags,
        },
      });

      // build diff
      const diff: Record<string, { old: unknown; new: unknown }> = {};
      for (const key of Object.keys(payload)) {
        const k = key as keyof typeof payload;
        if ((existing as any)[k] !== (buyer as any)[k]) {
          diff[k] = {
            old: (existing as any)[k],
            new: (buyer as any)[k],
          };
        }
      }

      if (Object.keys(diff).length > 0) {
        await tx.buyerHistory.create({
          data: {
            buyerId: buyer.id,
            changedBy: CURRENT_OWNER,
            diff:JSON.parse(JSON.stringify(diff)) as Prisma.InputJsonValue,
          },
        });
      }

      return buyer;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ✅ Delete buyer
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.buyer.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.ownerId !== CURRENT_OWNER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.buyer.delete({ where: { id: params.id } });

      await tx.buyerHistory.create({
        data: {
          buyerId: existing.id,
          changedBy: CURRENT_OWNER,
          diff: { deleted: JSON.parse(JSON.stringify(existing)) } as Prisma.InputJsonValue,
        },
      });
    });

    return NextResponse.json({ message: "Buyer deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
