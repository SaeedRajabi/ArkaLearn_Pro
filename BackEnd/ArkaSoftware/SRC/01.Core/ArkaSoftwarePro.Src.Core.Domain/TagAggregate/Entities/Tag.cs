using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Aggregates;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities
{
    public class Tag : AggregateRoot
    {
        #region Properties
        public TagName TagName { get; private set; }
        #endregion

        #region References Properties

        //Self Relation

        #endregion

        #region CTORs
        public Tag(TagName tagName)
        {
            TagName = tagName;
            AddEvent(new TagAdded(tagName.Value));

        }
        private Tag() { }
        #endregion

        #region Behaviors IMP
        public void ChangeTagName(TagName tagName)
        {
            TagName = tagName;
            AddEvent(new TagNameChanged(tagName.Value));
        }
        #endregion
    }
}
