using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.AddTags;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.ChangeTagName;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.GetTagById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.SearchTagByInputValue;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    [ApiController]
    public class TagController : BaseController
    {

        #region Get Tag By Id (Read By Id)
        /// <summary>
        /// Retrieves Tag details by its ID.
        /// </summary>
        /// <param name="tagQuery">Query containing the Tag ID.</param>
        /// <returns>Tag details.</returns>
        [HttpGet("GetById")]
        public async Task<IActionResult> GetTagById([FromQuery] GetTagByIdQuery tagQuery)
            => await Query<GetTagByIdQuery, TagQri>(tagQuery);

        #endregion

        #region Shearch Tag With Pagenations And Personal Properties Settings

        /// <summary>
        /// Searches for Tags on a given input value.
        /// </summary>
        /// <param name="tagQuery">Search query containing the input value.</param>
        /// <returns>Paged list of Tags matching the search criteria.</returns>
        [HttpGet("Search")]
        public async Task<IActionResult> SearchTagByInputValue([FromQuery] SearchTagQuery tagQuery)
            => await Query<SearchTagQuery, PagedData<SearchTagQri>>(tagQuery);
        #endregion





        [HttpPost("Add")]
        [Authorize]
        public async Task<IActionResult> AddTag(AddTag tag)
        {
            return await Create<AddTag, string>(tag);
        }

        [HttpPut("UpdateTagName")]
        public async Task<IActionResult> TagNameUpdate(UpdateTagName newTagName)
        {
            return await Edit<UpdateTagName, string>(newTagName);
        }




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
