using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateOrders;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrdersCommand>
{
    public CreateOrderCommandValidator(ITranslator translator)
    {

    }
}