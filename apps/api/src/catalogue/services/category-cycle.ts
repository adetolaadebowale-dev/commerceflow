import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import type { CategoryRepository } from "../repositories";

export async function assertNoParentCycle(
  categoryRepository: CategoryRepository,
  storeId: string,
  categoryId: string,
  parentId: string,
): Promise<void> {
  let currentId: string | undefined = parentId;

  while (currentId) {
    if (currentId === categoryId) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.PARENT_CYCLE,
        "Category parent assignment would create a cycle",
        400,
      );
    }

    const ancestor = await categoryRepository.findById(storeId, currentId);

    if (!ancestor) {
      return;
    }

    currentId = ancestor.parentId;
  }
}
