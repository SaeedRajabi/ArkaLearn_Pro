using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace ArkaSoftwarePro.Src.Endpoints.API.Common;

/// <summary>
/// Swashbuckle cannot generate OpenAPI for multipart/form-data actions that bind IFormFile.
/// Hide those actions from API Explorer so /swagger/v1/swagger.json does not throw 500.
/// </summary>
public sealed class FormFileApiExplorerConvention : IActionModelConvention
{
    public void Apply(ActionModel action)
    {
        if (action.ApiExplorer?.IsVisible == false)
            return;

        foreach (var parameter in action.Parameters)
        {
            if (IsFormFileType(parameter.ParameterType))
            {
                action.ApiExplorer.IsVisible = false;
                return;
            }

            if (UsesFormBinding(parameter) && TypeContainsFormFile(parameter.ParameterType))
            {
                action.ApiExplorer.IsVisible = false;
                return;
            }
        }
    }

    private static bool UsesFormBinding(ParameterModel parameter) =>
        parameter.BindingInfo?.BindingSource != null &&
        (parameter.BindingInfo.BindingSource == BindingSource.Form ||
         parameter.BindingInfo.BindingSource == BindingSource.FormFile ||
         parameter.BindingInfo.BindingSource.CanAcceptDataFrom(BindingSource.Form));

    private static bool IsFormFileType(Type type) =>
        type == typeof(IFormFile) || type == typeof(IFormFile[]);

    private static bool TypeContainsFormFile(Type type)
    {
        if (IsFormFileType(type))
            return true;

        if (type.IsPrimitive || type == typeof(string) || type.IsEnum)
            return false;

        foreach (var prop in type.GetProperties())
        {
            if (IsFormFileType(prop.PropertyType) || TypeContainsFormFile(prop.PropertyType))
                return true;
        }

        return false;
    }
}
