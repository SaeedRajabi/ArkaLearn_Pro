using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.AddCategories;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.UpdateCategoriesName;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.UpdateCategory;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.DeleteCategory;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class CategoryController : BaseController
    {
        #region Get City By Id (Read By Id)
        /// <summary>
        /// Retrieves Categories details by its ID.
        /// </summary>
        /// <param name="cityQuery">Query containing the Categories ID.</param>
        /// <returns>Category details.</returns>
        [HttpGet("GetById")]
        public async Task<IActionResult> GetCategoryById([FromQuery] GetCategoryByIdQuery categoryQuery)
            => await Query<GetCategoryByIdQuery, CategoryQri>(categoryQuery);

        #endregion



        
        [HttpPost("add-category")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public Task<IActionResult> AddCategory([FromForm] AddCategory category)
        {
            return Create<AddCategory, string>(category);
        }

        [HttpPut("UpdateCategoryName")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public Task<IActionResult> CategoryNameUpdate(CategoryNameUpdate newCategoryName)
        {
            return Edit<CategoryNameUpdate, string>(newCategoryName);
        }

        [HttpPost("update-category")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> UpdateCategory([FromForm] UpdateCategory category)
            => Edit<UpdateCategory, string>(category);

        [HttpDelete("Delete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> Delete([FromQuery] long categoryId)
            => Edit<DeleteCategoryCommand, string>(new DeleteCategoryCommand { CategoryId = categoryId });

        #region Shearch Category With Pagenations And Personal Properties Settings And CategoryChildren

        /// <summary>
        /// Searches for Categories With Children based on a given input value.
        /// </summary>
        /// <param name="categoryQuery">Search query containing the input value.</param>
        /// <returns>Paged list of cities matching the search criteria.</returns>
        [HttpGet("SearchCategories")]
        public async Task<IActionResult> SearchCategoryByInputValue([FromQuery] SearchCategoryQuery categoryQuery)
            => await Query<SearchCategoryQuery, PagedData<SearchCategoryQri>>(categoryQuery);
        #endregion


        #region Clear GC Methods

        /// <summary>
        /// Clears unused memory and triggers garbage collection.
        /// </summary>
        /// <returns>Boolean value indicating whether the operation was successful.</returns>
        [HttpGet("Clear")]
        public bool Clear()
        {
            GC.Collect(2);
            return true;
        }

        #endregion
    }
}
