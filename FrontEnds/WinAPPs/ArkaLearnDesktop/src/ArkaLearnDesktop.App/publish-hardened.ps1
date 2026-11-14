# Hardened Windows publish for ArkaSoftware Desktop.
# Raises reverse-engineering cost; cannot make .NET/WPF apps undecompilable.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

Write-Host "==> Publishing self-contained win-x64 (ReadyToRun, no PDB)..."
dotnet publish .\ArkaLearnDesktop.App.csproj `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:EnableCompressionInSingleFile=true `
  -p:PublishReadyToRun=true `
  -p:DebugType=none `
  -p:DebugSymbols=false `
  -o .\bin\Release\net10.0-windows\publish\win-x64-hardened

Write-Host ""
Write-Host "Published to: $root\bin\Release\net10.0-windows\publish\win-x64-hardened"
Write-Host "Optional: install Obfuscar globally and run against framework-dependent output before single-file pack."
Write-Host "  dotnet tool install -g Obfuscar.GlobalTool"
Write-Host "  obfuscar.console obfuscar.xml"
