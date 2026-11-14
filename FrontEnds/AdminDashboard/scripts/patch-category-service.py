from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'src/services/category-service.ts'
text = p.read_text(encoding='utf-8')
if 'unwrapQueryPayload' not in text:
    insert = """
function unwrapQueryPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  const nested = obj.data ?? obj.Data ?? obj.result ?? obj.Result;
  if (nested && typeof nested === 'object') return nested as Record<string, unknown>;
  return obj;
}

"""
    text = text.replace('export async function getCategoryById', insert + 'export async function getCategoryById', 1)
    text = text.replace(
        "    const response = await apiClient.get<Record<string, unknown>>('/Category/GetById', {",
        "    const response = await apiClient.get('/Category/GetById', {",
    )
    text = text.replace(
        "    const raw = (response.data?.data ?? response.data) as Record<string, unknown>;\n    if (!raw || typeof raw !== 'object') return null;",
        "    const raw = unwrapQueryPayload(response.data);\n    if (!raw) return null;",
    )
    p.write_text(text, encoding='utf-8')
    print('category-service updated')
else:
    print('already updated')
