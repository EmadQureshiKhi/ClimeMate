import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.sEMAClient.findUnique({
      where: { id },
      include: {
        stakeholders: true,
        blockchainLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching SEMA client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update a client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Don't allow updating demo client
    const existingClient = await prisma.sEMAClient.findUnique({
      where: { id },
    });

    if (existingClient?.status === 'demo') {
      return NextResponse.json(
        { error: 'Cannot update demo client' },
        { status: 403 }
      );
    }

    const client = await prisma.sEMAClient.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ client }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating SEMA client:', error);
    return NextResponse.json(
      { error: 'Failed to update client', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Don't allow deleting demo client
    const existingClient = await prisma.sEMAClient.findUnique({
      where: { id },
    });

    if (existingClient?.status === 'demo') {
      return NextResponse.json(
        { error: 'Cannot delete demo client' },
        { status: 403 }
      );
    }

    await prisma.sEMAClient.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting SEMA client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client', details: error.message },
      { status: 500 }
    );
  }
}
