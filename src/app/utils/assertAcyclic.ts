import AppError from "../errors/AppError.js";

export default function assertAcyclic(
  parents: ReadonlyMap<string, string | null>,
  message: string
) {
  const checked = new Set<string>();
  for (const id of parents.keys()) {
    const path = new Set<string>();
    let current: string | null = id;
    while (current !== null && !checked.has(current)) {
      if (path.has(current)) throw new AppError(400, message);
      path.add(current);
      current = parents.get(current) ?? null;
    }
    for (const visited of path) checked.add(visited);
  }
}
