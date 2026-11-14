namespace ArkaLearnDesktop.Domain.Common;

/// <summary>Marker for local (desktop) domain entities persisted in SQLite.</summary>
public interface ILocalEntity
{
    long Id { get; }
}
