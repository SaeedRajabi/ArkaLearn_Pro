using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities
{
    public class Category : AggregateRoot
    {
        #region Properties

        public CategoryTitleVo? Title { get; private set; }
        public Description? Description { get; private set; }
        public Image? CategoryImage { get; private set; }

        #endregion

        #region References Properties
        public IReadOnlyList<Course> Courses => _courses;
        private List<Course> _courses = new List<Course>();


        //Self Relation
        public long? ParentId { get; set; }
        public Category? Parent { get; set; }
        public IReadOnlyList<Category> Children => _children;
        private List<Category> _children = new List<Category>();
        #endregion

        #region CTORs
        public Category(CategoryTitleVo name,Description categoryDescription,Image categoryImage, long? parentId)
        {
            Title = name;
            ParentId = (parentId == 0) ? null : parentId;
            AddEvent(parentId.HasValue
                ? new CategoryAdded(name.Value!, parentId!.Value)
                : new CategoryAdded(name.Value!, null));
            CategoryImage = categoryImage ?? null;
            Description = categoryDescription;
        }
        private Category() { }
        #endregion

        #region Factory Methods
        public static Category Create(CategoryTitleVo name , Description categoryDescription, Image categoryImage, long parentId) 
            => new Category(name, categoryDescription, categoryImage, parentId);

        public static Category CreateFromQueryModel(string categoryName,string description, string categoryImage , long? parentId, List<Category> children)
        {
            var category = new Category(new CategoryTitleVo(categoryName) , new Description(description) , new Image(categoryImage) , parentId);
            if (children != null!)
            {
                foreach (var child in children)
                {
                    var childCategory = CreateFromQueryModel(
                        child.Title!.Value!, 
                        child.Description!.Value,
                        child.CategoryImage!.ImageURL ?? "" , 
                        child.ParentId, child._children);

                    category._children.Add(childCategory);
                }
            }
            return category;
        }



        #endregion

        #region Behaviors IMP
        public void ChangeCategoryName(CategoryTitleVo categoryName)
        {
            Title = categoryName;
            AddEvent(new CategoryNameChanged(categoryName.Value!));
        }

        public void ChangeCategoryImage(Image categoryImage)
        {
            CategoryImage = categoryImage;
            AddEvent(new CategoryImageChanged(categoryImage.ImageURL ?? ""));
        }

        public void ChangeCategoryDescription(Description categoryDescription)
        {
            Description = categoryDescription;
        }

        public void ChangeParent(long? parentId)
        {
            ParentId = parentId is > 0 ? parentId : null;
        }

        public void AddCategoryChild()
        {

        }
        public void RemoveCategory(long categoryId)
        {

        }
        #endregion
    }
}
