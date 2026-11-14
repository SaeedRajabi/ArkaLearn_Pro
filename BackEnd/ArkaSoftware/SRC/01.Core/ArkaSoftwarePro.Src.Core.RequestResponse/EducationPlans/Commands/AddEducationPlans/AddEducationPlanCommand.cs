using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.AddEducationPlans
{
    public class AddEducationPlanCommand:ICommand<string> , IWebRequest
    {
        public string? Title { get; set; }
        public int HourlyRate { get; set; }
        public int TotalHours { get; set; }
        public decimal TotalCost { get; set; }
        public string? Description { get; set; }
        public long ManagedRoomStudentId { get; set; }
        public long RoomId { get; set; }
        public long OwnerUserId { get; set; }
        public DateTime StartDateUtc { get; set; }
        public DateTime EndDateUtc { get; set; }
        /// <summary>cash | installment</summary>
        public string PaymentType { get; set; } = "cash";
        public List<EducationPlanInstallmentDto> Installments { get; set; } = [];
        public string Path => "/api/Service/EducationPlan/Add-Plan";
    }
}
