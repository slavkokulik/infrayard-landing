param([string]$ProjectPath = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$mediaFileType = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$clipType = [Windows.Media.Editing.MediaClip,Windows.Media.Editing,ContentType=WindowsRuntime]
$compositionType = [Windows.Media.Editing.MediaComposition,Windows.Media.Editing,ContentType=WindowsRuntime]
$precisionType = [Windows.Media.Editing.VideoFramePrecision,Windows.Media.Editing,ContentType=WindowsRuntime]
$imageStreamType = [Windows.Graphics.Imaging.ImageStream,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$genericAwaitMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await-MediaOperation($Operation, $ResultType) {
  $operationTask = $genericAwaitMethod.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  $operationTask.Wait()
  return $operationTask.Result
}
$mediaPath = Join-Path $ProjectPath 'assets\final_hq_infrayard.mp4'
$mediaFile = Await-MediaOperation ($mediaFileType::GetFileFromPathAsync($mediaPath)) $mediaFileType
$mediaClip = Await-MediaOperation ($clipType::CreateFromFileAsync($mediaFile)) $clipType
Write-Output ('Duration seconds: ' + $mediaClip.OriginalDuration.TotalSeconds)
$composition = [Activator]::CreateInstance($compositionType)
$clipCollectionType = [System.Collections.Generic.ICollection[Windows.Media.Editing.MediaClip]]
$clipCollectionType.GetMethod('Add').Invoke($composition.Clips, @($mediaClip))
$frames = @(
  @{Name='product-poster.jpg';Seconds=60},
  @{Name='product-template.jpg';Seconds=20},
  @{Name='product-review.jpg';Seconds=60},
  @{Name='product-operate.jpg';Seconds=120}
)
foreach ($capture in $frames) {
  $timestamp = [Math]::Min($capture.Seconds, $mediaClip.OriginalDuration.TotalSeconds - 1)
  $frame = Await-MediaOperation ($composition.GetThumbnailAsync([TimeSpan]::FromSeconds($timestamp), 1280, 720, $precisionType::NearestFrame)) $imageStreamType
  $frameInput = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($frame)
  $frameOutput = [System.IO.File]::Create((Join-Path $ProjectPath ('assets\' + $capture.Name)))
  try { $frameInput.CopyTo($frameOutput) } finally { $frameOutput.Dispose(); $frameInput.Dispose() }
  Write-Output ('Extracted ' + $capture.Name + ' at ' + $timestamp + 's')
}
