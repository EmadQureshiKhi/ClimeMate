import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Update an internal topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Recalculate significance if severity or likelihood changed
    const significance = (body.severity || 0) * (body.likelihood || 0);
    const isMaterial = significance >= 10;

    const topic = await prisma.sEMAInternalTopic.update({
      where: { id },
      data: {
        ...body,
        significance,
        isMaterial,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating internal topic:', error);
    return NextResponse.json(
      { error: 'Failed to update internal topic', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete an internal topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.sEMAInternalTopic.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Internal topic deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting internal topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete internal topic', details: error.message },
      { status: 500 }
    );
  }
}
