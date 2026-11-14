using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Categories;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class CategoryQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ICategoryQueryRepository
    {
        public async Task<CategoryQri> GetCategoryByIdExecuteAsync(GetCategoryByIdQuery query)
        {
            var result = await _dbContext.Categories.AsNoTracking()
                .Include(x => x.Children)
                    .ThenInclude(c => c.Courses)
                .Include(x => x.Parent)
                .Include(x => x.Courses)
                .FirstOrDefaultAsync(x => x.Id == query.CategoryId);
            if (result is null)
                return null!;
            return new CategoryQri
            {
                Id = result.Id,
                CategoryDescription = result.CategoryDescription ?? string.Empty,
                CategoryName = result.Title,
                ImageUrl = result.CategoryImage ?? string.Empty,
                ParentId = result.ParentId,
                ParentName = result.Parent?.Title,
                CourseCount = result.Courses.Count,
                Children = result.Children
                    .OrderBy(c => c.Title)
                    .Select(c => new CategoryChildQri
                    {
                        Id = c.Id,
                        CategoryName = c.Title,
                        ImageUrl = c.CategoryImage ?? string.Empty,
                        CourseCount = c.Courses.Count,
                    })
                    .ToList(),
            };
        }
        public async Task<PagedData<SearchCategoryQri>?> SearchCategoryExecuteAsync(SearchCategoryQuery query)
        {
            PagedData<SearchCategoryQri?> result = new();

            // Get All Categories
            var allCategories = await _dbContext.Categories.AsNoTracking()
                .ToListAsync();

            // Filter By Category Name
            var matchingCategories = allCategories
                .Where(x => string.IsNullOrEmpty(query.CategoryName) ||
                            x.Title.ToLower().Contains(query.CategoryName.ToLower()))
                .ToList();


            var relatedCategories = new HashSet<CategoryQueryModel>();

            foreach (var category in matchingCategories)
            {
                // Added Current Category
                relatedCategories.Add(category);

                // Added Parent 
                var parent = category.ParentId.HasValue ? allCategories.FirstOrDefault(c => c.Id == category.ParentId) : null;
                while (parent != null)
                {
                    relatedCategories.Add(parent);
                    parent = parent.ParentId.HasValue ? allCategories.FirstOrDefault(c => c.Id == parent.ParentId) : null;
                }
            }
            // Convert List To Tree Structure
            var categoryDictionary = relatedCategories.ToDictionary(c => c.Id);

            foreach (var category in relatedCategories)
            {
                if (category.ParentId.HasValue && categoryDictionary.ContainsKey(category.ParentId.Value))
                {
                    var parentCategory = categoryDictionary[category.ParentId.Value];
                    parentCategory.Children.Add(category);
                }
            }

            // Parents Is Not ParentId Fetch
            var courseCountsByCategory = await _dbContext.Courses.AsNoTracking()
                .Where(c => c.CategoryId != null)
                .GroupBy(c => c.CategoryId!.Value)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

            var rootCategories = relatedCategories
                .Where(c => !c.ParentId.HasValue)
                .Select(c => BuildCategoryTree(c, courseCountsByCategory)!)
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .ToList();

            result.QueryResult = rootCategories!;
            result.TotalCount = relatedCategories.Count;
            return result!;
        }

        public async Task<bool> IsDescendantOfAsync(long ancestorId, long possibleDescendantId)
        {
            if (ancestorId == possibleDescendantId)
                return true;

            var links = await _dbContext.Categories.AsNoTracking()
                .Select(c => new { c.Id, c.ParentId })
                .ToListAsync();

            var childrenByParent = links
                .Where(x => x.ParentId.HasValue)
                .GroupBy(x => x.ParentId!.Value)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Id).ToList());

            var queue = new Queue<long>();
            var visited = new HashSet<long> { ancestorId };
            queue.Enqueue(ancestorId);

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (!childrenByParent.TryGetValue(current, out var children))
                    continue;

                foreach (var childId in children)
                {
                    if (childId == possibleDescendantId)
                        return true;
                    if (visited.Add(childId))
                        queue.Enqueue(childId);
                }
            }

            return false;
        }

        private SearchCategoryQri BuildCategoryTree(CategoryQueryModel category, Dictionary<long, int> courseCounts)
        {
            return new SearchCategoryQri
            {
                CategoryId = category.Id,
                ImageUrl = category.CategoryImage,
                Description = category.CategoryDescription!,
                Name = category.Title,
                CreateAt = category.CreateAt.ToString("f"),
                CourseCount = courseCounts.GetValueOrDefault(category.Id, 0),
                BusinessId = category.BusinessId,
                Children = category.Children.Select(child => BuildCategoryTree(child, courseCounts)!).ToList()
            };
        }


    }
}
