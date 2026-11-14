using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherFollow : Entity
{
    public long FollowerUserId { get; private set; }
    public long TeacherId { get; private set; }

    private TeacherFollow() { }

    public static TeacherFollow Create(long followerUserId, long teacherId) =>
        new() { FollowerUserId = followerUserId, TeacherId = teacherId };
}
