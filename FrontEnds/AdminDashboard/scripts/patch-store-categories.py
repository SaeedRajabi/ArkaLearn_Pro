from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'src/lib/store.ts'
text = p.read_text(encoding='utf-8')
start = text.index('    /** نگاشت پاسخ API دسته\u200cبندی')
end = text.index('    const mapApiCoursesToCourses')
replacement = """    const mapCategoryImages = (node: Category): Category => ({
        ...node,
        categoryImage: node.categoryImage ? resolveStaticAssetUrl(node.categoryImage) || undefined : undefined,
        children: node.children?.map(mapCategoryImages),
    });

    const applyCategoryResponse = (raw: unknown[]) => {
        const tree = raw.map((item) => mapRawCategory(item as Record<string, unknown>, 0, null)).map(mapCategoryImages);
        setCategoryTree(tree);
        setCategories(flattenCategories(tree).map(mapCategoryImages));
    };

"""
text = text[:start] + replacement + text[end:]
text = text.replace(
    ".then(x => setCategories(mapApiCategoriesToCategories(toList(x))))\n            .catch(() => setCategories([]));",
    ".then(x => applyCategoryResponse(toList(x)))\n            .catch(() => {\n                setCategories([]);\n                setCategoryTree([]);\n            });",
    1,
)
text = text.replace(
    "refreshCategories: () => getCategories('', 1, 500).then(x => setCategories(mapApiCategoriesToCategories(toList(x)))).catch(() => {}),",
    "refreshCategories: () => getCategories('', 1, 500).then(x => applyCategoryResponse(toList(x))).catch(() => {}),",
)
text = text.replace(
    "        categories,\n        courseReviews,",
    "        categories,\n        categoryTree,\n        courseReviews,",
)
p.write_text(text, encoding='utf-8')
print('store updated')
