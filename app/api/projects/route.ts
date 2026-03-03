import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/generateSlug';
import prisma from '@/lib/prisma';

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
        projectId: project.id,
      },
    });

    // Создаем колонки по умолчанию (без status enum)
    const columns = [
      { name: 'Нужно сделать', order: 0 },
      { name: 'В работе', order: 1 },
      { name: 'На проверке', order: 2 },
      { name: 'Готово', order: 3 },
    ];

    await prisma.column.createMany({
      data: columns.map((col) => ({
        name: col.name,
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
