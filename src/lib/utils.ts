export function getRelationName(
  relation: unknown,
  fallback = "Mavjud emas"
): string {
  if (!relation) return fallback;
  if (typeof relation === 'string') return relation;
  if (typeof relation === 'object' && relation !== null) {
    const r = relation as Record<string, unknown>;
    if (r.first_name || r.last_name) {
      return `${r.first_name || ''} ${r.last_name || ''}`.trim();
    }
    if (r.name) return String(r.name);
    if (r.title) return String(r.title);
    if (r._id) return String(r._id);
  }
  return fallback;
}

export function getRelationId(relation: unknown): string {
  if (!relation) return '';
  if (typeof relation === 'string') return relation;
  if (typeof relation === 'object' && relation !== null && '_id' in relation) {
    return String((relation as { _id: unknown })._id);
  }
  return '';
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('uz-UZ');
  } catch {
    return dateStr;
  }
}

export function formatPrice(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(num) + " so'm";
}