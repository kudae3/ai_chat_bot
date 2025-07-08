import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getEmbedding from "@/lib/getEmbedding";

const QDRANT_API_URL = process.env.QDRANT_API_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;

export async function POST() {
  try {
    
    // 1. Fetch blogs from DB
    const blogs = await prisma.posts.findMany({
      select: { id: true, title: true, body: true },
    });

    const courses = await prisma.courses.findMany({
      select: { id: true, name: true, description: true, course_guarantee: true },
    });

    // 2. Generate embeddings and prepare Qdrant points
    const blogPoints = await Promise.all(
      blogs.map(async (blog) => ({
        id: Number(blog.id),
        vector: await getEmbedding(`${blog.title}\n${blog.body}`),
        payload: { title: blog.title, body: blog.body },
      }))
    );

    const coursePoints = await Promise.all(
      courses.map(async (course) => ({
        id: Number(course.id),
        vector: await getEmbedding(`${course.name}\n${course.description}\n${course.course_guarantee}`),
        payload: { 
          title: course.name, 
          body: course.description, 
          guarantee: course.course_guarantee
        },
      }))
    );

    const points = [...blogPoints, ...coursePoints];

    // Upload to Qdrant
    const response = await fetch(`${QDRANT_API_URL}/collections/chatbot/points?wait=true`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "api-key": QDRANT_API_KEY,
      },
      body: JSON.stringify({ points }),
    });

    const qdrantData = await response.json();

    return NextResponse.json({
      message: "Knowledge base uploaded to Qdrant",
      qdrant: qdrantData,
    });
  } catch (error) {
    console.error("Error in preload POST:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}