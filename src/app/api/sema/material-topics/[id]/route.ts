import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Update a material topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const topic = await prisma.sEMAMaterialTopic.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating material topic:', error);
    return NextResponse.json(
      { error: 'Failed to update material topic', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a material topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.sEMAMaterialTopic.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Material topic deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting material topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete material topic', details: error.message },
      { status: 500 }
    );
  }
}
