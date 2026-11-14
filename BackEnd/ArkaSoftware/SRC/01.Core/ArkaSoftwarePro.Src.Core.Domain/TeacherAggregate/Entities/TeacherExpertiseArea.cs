using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities
{
    /// <summary>
    /// حوضه های تخصصی و مهارت های استاد
    /// </summary>
    public class TeacherExpertiseArea:Entity
    {

        #region Properties
        /// <summary>
        /// نام مهارت
        /// </summary>
        public SkillName? Name { get; private set; }

        /// <summary>
        /// درصد تخصص در این مهارت از ۱۰۰ درصد
        /// </summary>
        public SkillRate? Rate { get; private set; }

        #endregion
        #region References

        public Teacher? Teacher { get; private set; }
        public long TeacherId { get; private set; }

        #endregion
        #region CTORs
        private TeacherExpertiseArea(SkillName name, SkillRate rate)
        {
            Name = name;
            Rate = rate;
        }
        private TeacherExpertiseArea()
        {
            
        }
        #endregion
        #region Factories
        public static TeacherExpertiseArea Create(string name, int rate)
            => new TeacherExpertiseArea(new SkillName(name), new SkillRate(rate));

        #endregion
    }

}
