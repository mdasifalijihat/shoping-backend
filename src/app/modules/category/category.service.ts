import { Prisma, type Category } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import assertAcyclic from "../../utils/assertAcyclic.js";
import slugGenerator from "../../utils/slugGenerator.js";
import type {
  CategoryOrder,
  CreateCategory,
  UpdateCategory,
} from "./category.validation.js";

const orderBy = [
  { orderIndex: "asc" },
  { id: "asc" },
] satisfies Prisma.CategoryOrderByWithRelationInput[];

type CategoryNode<T> = T & { children: CategoryNode<T>[] };
type CategoryLink = Pick<Category, "id" | "parentId">;

function buildTree<T extends CategoryLink>(
  categories: T[],
  parentId: string | null = null,
  promoteOrphans = false
): CategoryNode<T>[] {
  const nodes = new Map<string, CategoryNode<T>>(
    categories.map((category) => [category.id, { ...category, children: [] }])
  );
  const roots: CategoryNode<T>[] = [];
  for (const node of nodes.values()) {
    const parent =
      node.parentId === null ? undefined : nodes.get(node.parentId);
    if (node.parentId === parentId || (promoteOrphans && !parent))
      roots.push(node);
    else parent?.children.push(node);
  }
  return roots;
}

export function categoryAncestors<T extends CategoryLink>(
  category: T,
  byId: ReadonlyMap<string, T>
) {
  const ancestors: T[] = [];
  const seen = new Set([category.id]);
  let parentId = category.parentId;
  while (parentId !== null) {
    const parent = byId.get(parentId);
    if (!parent || seen.has(parentId)) return null;
    seen.add(parentId);
    ancestors.push(parent);
    parentId = parent.parentId;
  }
  return ancestors.reverse();
}

export function descendantIds(
  categories: CategoryLink[],
  rootId: string | null
) {
  const children = new Map<string | null, string[]>();
  for (const { id, parentId } of categories) {
    const siblings = children.get(parentId);
    if (siblings) siblings.push(id);
    else children.set(parentId, [id]);
  }
  const pending = rootId === null ? [...(children.get(null) ?? [])] : [rootId];
  const ids = new Set<string>();
  while (pending.length > 0) {
    const id = pending.pop();
    if (id === undefined || ids.has(id)) continue;
    ids.add(id);
    for (const child of children.get(id) ?? []) pending.push(child);
  }
  return [...ids];
}

export async function list(featuredOnly: boolean) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy,
  });
  if (!featuredOnly) return buildTree(categories);

  const visible = new Set(descendantIds(categories, null));
  const featured = categories.filter(
    ({ id, isFeatured }) => isFeatured && visible.has(id)
  );
  return buildTree(featured, null, true);
}

export async function listAdmin() {
  return buildTree(
    await prisma.category.findMany({
      orderBy,
      include: { _count: { select: { products: true } } },
    })
  );
}

export async function getBySlug(slug: string) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy,
  });
  const category = categories.find((entry) => entry.slug === slug);
  const byId = new Map(categories.map((entry) => [entry.id, entry]));
  if (!category || categoryAncestors(category, byId) === null)
    throw new AppError(404, "Category not found");
  return { ...category, children: buildTree(categories, category.id) };
}

export async function requireCategory(id: string) {
  if (
    !(await prisma.category.findUnique({ where: { id }, select: { id: true } }))
  ) {
    throw new AppError(404, "Category not found");
  }
}

export async function create(data: CreateCategory) {
  if (data.parentId) await requireCategory(data.parentId);
  return prisma.category.create({
    data: { ...data, slug: slugGenerator(data.name) },
  });
}

async function updateHierarchy<T>(
  moves: { id: string; parentId?: string | null }[],
  write: (tx: Prisma.TransactionClient) => Promise<T>
) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const categories = await tx.category.findMany({
          select: { id: true, parentId: true },
        });
        const parents = new Map(
          categories.map(({ id, parentId }) => [id, parentId])
        );
        for (const { id, parentId } of moves) {
          if (!parents.has(id)) throw new AppError(404, "Category not found");
          if (parentId === undefined) continue;
          if (parentId !== null && !parents.has(parentId))
            throw new AppError(404, "Parent category not found");
          parents.set(id, parentId);
        }
        assertAcyclic(parents, "Categories cannot form a parent cycle");
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
        "The category hierarchy changed concurrently. Retry the update."
      );
    }
    throw error;
  }
}

export function update(id: string, data: UpdateCategory) {
  if (data.parentId === undefined)
    return prisma.category.update({ where: { id }, data });
  return updateHierarchy([{ id, parentId: data.parentId }], (tx) =>
    tx.category.update({ where: { id }, data })
  );
}

export function reorder({ items }: CategoryOrder) {
  return updateHierarchy(items, (tx) =>
    Promise.all(
      items.map(({ id, ...data }) =>
        tx.category.update({ where: { id }, data })
      )
    )
  );
}

export async function remove(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new AppError(
        409,
        "Move or remove the category's products before deleting it"
      );
    }
    throw error;
  }
}
