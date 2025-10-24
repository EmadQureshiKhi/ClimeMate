import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Update a stakeholder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Transform snake_case to camelCase for Prisma
    const transformedData: any = {};
    
    if (body.name !== undefined) transformedData.name = body.name;
    if (body.category !== undefined) transformedData.category = body.category;
    if (body.stakeholder_type !== undefined) transformedData.stakeholderType = body.stakeholder_type;
    if (body.stakeholderType !== undefined) transformedData.stakeholderType = body.stakeholderType;
    if (body.dependency_economic !== undefined) transformedData.dependencyEconomic = body.dependency_economic;
    if (body.dependencyEconomic !== undefined) transformedData.dependencyEconomic = body.dependencyEconomic;
    if (body.dependency_social !== undefined) transformedData.dependencySocial = body.dependency_social;
    if (body.dependencySocial !== undefined) transformedData.dependencySocial = body.dependencySocial;
    if (body.dependency_environmental !== undefined) transformedData.dependencyEnvironmental = body.dependency_environmental;
    if (body.dependencyEnvironmental !== undefined) transformedData.dependencyEnvironmental = body.dependencyEnvironmental;
    if (body.influence_economic !== undefined) transformedData.influenceEconomic = body.influence_economic;
    if (body.influenceEconomic !== undefined) transformedData.influenceEconomic = body.influenceEconomic;
    if (body.influence_social !== undefined) transformedData.influenceSocial = body.influence_social;
    if (body.influenceSocial !== undefined) transformedData.influenceSocial = body.influenceSocial;
    if (body.influence_environmental !== undefined) transformedData.influenceEnvironmental = body.influence_environmental;
    if (body.influenceEnvironmental !== undefined) transformedData.influenceEnvironmental = body.influenceEnvironmental;
    if (body.population_size !== undefined) transformedData.populationSize = body.population_size;
    if (body.populationSize !== undefined) transformedData.populationSize = body.populationSize;

    // Recalculate scores if dependency/influence values changed
    const totalScore = 
      (transformedData.dependencyEconomic ?? 0) +
      (transformedData.dependencySocial ?? 0) +
      (transformedData.dependencyEnvironmental ?? 0) +
      (transformedData.influenceEconomic ?? 0) +
      (transformedData.influenceSocial ?? 0) +
      (transformedData.influenceEnvironmental ?? 0);

    const dependencyScore = 
      (transformedData.dependencyEconomic ?? 0) +
      (transformedData.dependencySocial ?? 0) +
      (transformedData.dependencyEnvironmental ?? 0);

    const influenceScore = 
      (transformedData.influenceEconomic ?? 0) +
      (transformedData.influenceSocial ?? 0) +
      (transformedData.influenceEnvironmental ?? 0);

    const dependencyCategory = dependencyScore >= 12 ? 'High' : dependencyScore >= 9 ? 'Medium' : 'Low';
    const influenceCategory = influenceScore >= 12 ? 'High' : influenceScore >= 9 ? 'Medium' : 'Low';
    const isPriority = influenceCategory === 'High' || dependencyCategory === 'High';

    const stakeholder = await prisma.sEMAStakeholder.update({
      where: { id },
      data: {
        ...transformedData,
        totalScore,
        dependencyCategory,
        influenceCategory,
        isPriority,
      },
    });

    return NextResponse.json({ stakeholder }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating stakeholder:', error);
    return NextResponse.json(
      { error: 'Failed to update stakeholder', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a stakeholder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.sEMAStakeholder.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Stakeholder deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting stakeholder:', error);
    return NextResponse.json(
      { error: 'Failed to delete stakeholder', details: error.message },
      { status: 500 }
    );
  }
}
