import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const GET = async () =>  {
  try {
     const blogs = await prisma.posts.findMany({
      select: {
        title: true,
        body: true,
      },
    });
    console.log("Fetched blgos:", blogs);
    
    return NextResponse.json(blogs);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
