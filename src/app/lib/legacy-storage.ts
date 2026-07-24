export function readWithLegacyMigration(
  storage: Storage,
  currentKey: string,
  legacyKeys: readonly string[],
): string | null {
  const current = storage.getItem(currentKey);
  if (current !== null) return current;

  for (const legacyKey of legacyKeys) {
    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue === null) continue;

    try {
      storage.setItem(currentKey, legacyValue);
      storage.removeItem(legacyKey);
    } catch {
      return legacyValue;
    }
    return legacyValue;
  }

  return null;
}

export function removeWithLegacyKeys(
  storage: Storage,
  currentKey: string,
  legacyKeys: readonly string[],
) {
  storage.removeItem(currentKey);
  for (const legacyKey of legacyKeys) {
    storage.removeItem(legacyKey);
  }
}
