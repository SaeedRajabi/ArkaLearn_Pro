using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using Extensions.Chaching.Abstractions;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.Redis.Queries.Repositories
{
    public class RoomCacheQueryRepository(ICacheAdapter cache , IRoomQueryRepository roomQueryRepository):IRoomCacheQueryRepository
    {

        private string BuildCacheKey(string baseKey, int pageNumber)
        {
            return $"{baseKey}:page:{pageNumber}";
        }

        public async Task<PagedData<GetAllRoomsByOwnerIdQri>?> GetAllOwnerRoomWithCacheExecuteAsync(GetAllRoomsByOwnerIdQuery query)
        {
            var result = new PagedData<GetAllRoomsByOwnerIdQri>();
            var cacheKey = BuildCacheKey($"room:owner:{query.UserId}", query.PageNumber);

            var rooms = cache.Get<List<GetAllRoomsByOwnerIdQri>>(cacheKey);
            if (rooms! == null! || !rooms.Any())
                return result;

            var filtered = rooms.AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.RoomTitle))
            {
                var lowerTitle = query.RoomTitle.ToLower();
                filtered = filtered.Where(r => r.Title.ToLower().Contains(lowerTitle));
            }

            if (query.NeedTotalCount)
                result.TotalCount = filtered.Count();

            result.QueryResult = filtered
                .OrderBy(r => r.Title)
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .ToList();
            await Task.CompletedTask;
            return result;
        }

        public async Task<PagedData<GetAllRoomUserByRoomIdQri>?> GetAllRoomUserByRoomIdWithCacheExecuteAsync(GetAllRoomUserByRoomIdQuery query)
        {
            var cacheKey = BuildCacheKey($"room:users:{query.RoomId}", query.PageNumber);

            var cachedData = cache.Get<PagedData<GetAllRoomUserByRoomIdQri>>(cacheKey);
            await Task.CompletedTask;
            return cachedData;
            
        }

        public async Task<GetRoomByRoomIdQri> GetRoomByRoomIdWithCacheExecuteAsync(GetRoomByRoomIdQuery query)
        {
            var cacheKey = $"room:info:{query.RoomId}";
            var cachedData =  cache.Get<GetRoomByRoomIdQri>(cacheKey);
            await Task.CompletedTask;
            return cachedData;
        }

        public async Task<PagedData<GetAllMessageWithRoomIdQri>> GetAllMessageWithWithCacheRoomId(GetAllMessageWithRoomIdQuery query)
        {
            var cacheKey = BuildCacheKey($"room:messages:{query.RoomId}", query.PageNumber);
            var cachedData = cache.Get<PagedData<GetAllMessageWithRoomIdQri>>(cacheKey);
            await Task.CompletedTask;
            return cachedData;
        }
    }
}
