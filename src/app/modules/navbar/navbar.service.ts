import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import assertAcyclic from "../../utils/assertAcyclic.js";
import { Prisma, type NavbarItem } from "../../../generated/prisma/client.js";
import type {
  CreateNavbarItem,
  NavbarOrder,
  UpdateNavbarItem,
} from "./navbar.validation.js";

type NavbarNode = NavbarItem & { children: NavbarNode[] };

export async function list(activeOnly: boolean) {
  const items = await prisma.navbarItem.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
  });
  const nodes = new Map<string, NavbarNode>(
    items.map((item) => [item.id, { ...item, children: [] }])
  );
  const roots: NavbarNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      nodes.get(node.parentId)?.children.push(node);
    }
  }
  return roots;
}

export async function create(data: CreateNavbarItem) {
  if (
    data.parentId &&
    !(await prisma.navbarItem.findUnique({
      where: { id: data.parentId },
      select: { id: true },
    }))
  ) {
    throw new AppError(404, "Parent navbar item not found");
  }
  return prisma.navbarItem.create({ data });
}

async function updateHierarchy<T>(
  moves: { id: string; parentId?: string | null }[],
  write: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const items = await tx.navbarItem.findMany({
          select: { id: true, parentId: true },
        });
        const parents = new Map(
          items.map(({ id, parentId }) => [id, parentId])
        );
        for (const { id, parentId } of moves) {
          if (!parents.has(id))
            throw new AppError(404, "Navbar item not found");
          if (parentId === undefined) continue;
          if (parentId !== null && !parents.has(parentId)) {
            throw new AppError(404, "Parent navbar item not found");
          }
          parents.set(id, parentId);
        }
        assertAcyclic(parents, "Navbar items cannot form a parent cycle");
        return write(tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new AppError(
        409,
        "The navbar changed concurrently. Retry the update."
      );
    }
    throw error;
  }
}

export function update(id: string, data: UpdateNavbarItem) {
  if (data.parentId === undefined)
    return prisma.navbarItem.update({ where: { id }, data });
  return updateHierarchy([{ id, parentId: data.parentId }], (tx) =>
    tx.navbarItem.update({ where: { id }, data })
  );
}

export function reorder({ items }: NavbarOrder) {
  return updateHierarchy(items, (tx) =>
    Promise.all(
      items.map(({ id, ...data }) =>
        tx.navbarItem.update({ where: { id }, data })
      )
    )
  );
}

export async function remove(id: string) {
  await prisma.navbarItem.delete({ where: { id } });
}
