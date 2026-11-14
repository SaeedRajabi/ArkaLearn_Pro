using AutoMapper;
using Extensions.ObjectMappers.Abstractions;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Mapping;

public sealed class AutoMapperAdapter(IMapper mapper) : IMapperAdapter
{
    public TDestination Map<TSource, TDestination>(TSource source) => mapper.Map<TSource, TDestination>(source);
}
