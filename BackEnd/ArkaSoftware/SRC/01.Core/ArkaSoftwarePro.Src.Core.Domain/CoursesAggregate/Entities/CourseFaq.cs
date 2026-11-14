using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities
{
    public class CourseFaq:Entity
    {
        public Question? Question { get; private set; }
        public Answer? Answer { get; private set; }



        private CourseFaq(Question question , Answer answer)
        {
            Question = question;
            Answer = answer;
        }

        public CourseFaq(){}

        public static CourseFaq Create(string question, string answer) => 
            new CourseFaq(Question.Create(question) , Answer.Create(answer));


    }
}
