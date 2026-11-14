using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities
{
    /// <summary>
    /// نام دانشگاه استاد و مدرک تحصیلی که توی اون دانشگاه دریافت کرده
    /// </summary>
    public class TeacherEducation:Entity
    {
        #region Properties
        /// <summary>
        /// نام موسسه و یا دانشگاهی 
        /// </summary>
        public NameOfUniversity? NameOfInstitutionOrUniversity { get; private set; }

        /// <summary>
        /// نوع مدرک اخذ شده
        /// </summary>
        public TeacherDegreeTypes TypeOfDegree { get; private set; }


        /// <summary>
        /// عکس مدرک اخذ شده
        /// </summary>
        public Image? DegreeImage { get; private set; }


        #endregion


        #region References
        public Teacher? Teacher { get; private set; }
        public long TeacherId { get; private set; }

        #endregion


        #region CTORs
        private TeacherEducation(string nameOfInstitutionOrUniversity, TeacherDegreeTypes typeOfDegree , Image degreeImage)
        {
            NameOfInstitutionOrUniversity = nameOfInstitutionOrUniversity;
            TypeOfDegree = typeOfDegree;
            DegreeImage = degreeImage;
        }
        private TeacherEducation()
        {
            
        }
        #endregion

        #region Factories
        public static TeacherEducation Create(string nameOfInstitutionOrUniversity, TeacherDegreeTypes typeOfDegree , Image degreeImage)
            => new TeacherEducation(nameOfInstitutionOrUniversity, typeOfDegree , degreeImage);
        #endregion
    }

}
