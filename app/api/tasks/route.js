import { NextResponse } from "next/server";
import { requireAuth } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Build where clause
    const where = {
      userId: user.id,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        status: true,
        input: true,
        output: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.task.count({
      where,
    });

    return NextResponse.json(tasks, {
      headers: {
        'X-Total-Count': totalCount.toString(),
        'X-Page-Size': limit.toString(),
        'X-Page-Offset': offset.toString(),
      }
    });

  } catch (error) {
    console.error("Error fetching tasks:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
