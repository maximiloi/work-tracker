import { auth } from '@/lib/auth';
import { ColumnStatus } from '@/lib/generated/prisma/enums';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^а-яa-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + `-${Date.now()}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { name, description, clientName, clientContact, budget, deadline, color } = body;

    // Валидация обязательных полей
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Название проекта обязательно' }, { status: 400 });
    }

    const projectSlug = generateSlug(name);

    // Создаем проект
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        slug: projectSlug,
        description: description?.trim() || null,
        clientName: clientName?.trim() || null,
        clientContact: clientContact?.trim() || null,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
        color: color?.trim() || null,
        createdByUser: {
          connect: { id: userId },
        },
      },
    });

    // Создаем доску
    const board = await prisma.board.create({
      data: {
        name: 'Основная',
        project: {
          connect: { id: project.id },
        },
      },
    });

    // Создаем колонки по умолчанию
    const columns: Array<{ name: string; status: ColumnStatus; order: number }> = [
      { name: 'Backlog', status: ColumnStatus.BACKLOG, order: 0 },
      { name: 'Нужно сделать', status: ColumnStatus.TODO, order: 1 },
      { name: 'В работе', status: ColumnStatus.IN_PROGRESS, order: 2 },
      { name: 'Готово', status: ColumnStatus.DONE, order: 3 },
    ];

    await prisma.column.createMany({
      data: columns.map((col) => ({
        name: col.name,
        status: col.status,
        order: col.order,
        boardId: board.id,
      })),
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
        color: project.color,
      },
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
