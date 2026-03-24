param(
  [string]$RepoRoot = (Resolve-Path ".").Path
)

Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return [PSCustomObject]@{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }
  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Draw-Icon {
  param(
    [int]$Size,
    [string]$Path,
    [switch]$TransparentBackground
  )

  $canvas = New-Canvas -Width $Size -Height $Size
  $g = $canvas.Graphics
  $bmp = $canvas.Bitmap

  $navy = [System.Drawing.Color]::FromArgb(255, 11, 19, 43)
  $teal = [System.Drawing.Color]::FromArgb(255, 18, 132, 126)
  $mint = [System.Drawing.Color]::FromArgb(255, 112, 255, 221)
  $gold = [System.Drawing.Color]::FromArgb(255, 255, 199, 87)
  $cream = [System.Drawing.Color]::FromArgb(255, 248, 244, 231)

  if (-not $TransparentBackground) {
    $backPath = New-RoundedRectPath -X 0 -Y 0 -Width $Size -Height $Size -Radius ($Size * 0.22)
    $backBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      ([System.Drawing.Point]::new(0, 0)),
      ([System.Drawing.Point]::new($Size, $Size)),
      $navy,
      $teal
    )
    $g.FillPath($backBrush, $backPath)
    $backBrush.Dispose()

    $glow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, $mint))
    $g.FillEllipse($glow, $Size * 0.12, $Size * 0.1, $Size * 0.76, $Size * 0.76)
    $glow.Dispose()
  }

  $orbPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, $mint), [float]($Size * 0.06))
  $g.DrawEllipse($orbPen, $Size * 0.19, $Size * 0.19, $Size * 0.62, $Size * 0.62)
  $orbPen.Dispose()

  $vPen = New-Object System.Drawing.Pen($cream, [float]($Size * 0.085))
  $vPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $vPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($vPen, $Size * 0.29, $Size * 0.28, $Size * 0.50, $Size * 0.72)
  $g.DrawLine($vPen, $Size * 0.50, $Size * 0.72, $Size * 0.71, $Size * 0.28)
  $vPen.Dispose()

  $slashPen = New-Object System.Drawing.Pen($gold, [float]($Size * 0.03))
  $slashPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $slashPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($slashPen, $Size * 0.63, $Size * 0.25, $Size * 0.78, $Size * 0.14)
  $g.DrawLine($slashPen, $Size * 0.69, $Size * 0.38, $Size * 0.84, $Size * 0.27)
  $g.DrawLine($slashPen, $Size * 0.75, $Size * 0.51, $Size * 0.90, $Size * 0.40)
  $slashPen.Dispose()

  Save-Png -Bitmap $bmp -Path $Path
  $g.Dispose()
  $bmp.Dispose()
}

function Draw-Header {
  param(
    [int]$Width,
    [int]$Height,
    [string]$Path
  )

  $canvas = New-Canvas -Width $Width -Height $Height
  $g = $canvas.Graphics
  $bmp = $canvas.Bitmap

  $navy = [System.Drawing.Color]::FromArgb(255, 10, 17, 38)
  $teal = [System.Drawing.Color]::FromArgb(255, 17, 111, 109)
  $cyan = [System.Drawing.Color]::FromArgb(255, 120, 241, 224)
  $gold = [System.Drawing.Color]::FromArgb(255, 255, 199, 87)
  $cream = [System.Drawing.Color]::FromArgb(255, 250, 246, 234)
  $muted = [System.Drawing.Color]::FromArgb(220, 206, 225, 219)

  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    ([System.Drawing.Point]::new(0, 0)),
    ([System.Drawing.Point]::new($Width, $Height)),
    $navy,
    $teal
  )
  $g.FillRectangle($background, 0, 0, $Width, $Height)
  $background.Dispose()

  $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, $cyan))
  $g.FillEllipse($glowBrush, $Width * 0.58, -$Height * 0.1, $Width * 0.5, $Height * 0.9)
  $g.FillEllipse($glowBrush, -$Width * 0.08, $Height * 0.4, $Width * 0.35, $Height * 0.45)
  $glowBrush.Dispose()

  $iconPath = Join-Path $RepoRoot "assets\branding\vikiclow-master.png"
  Draw-Icon -Size 1024 -Path $iconPath
  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $g.DrawImage($icon, $Width * 0.08, $Height * 0.16, $Height * 0.48, $Height * 0.48)
  $icon.Dispose()

  $brandFont = New-Object System.Drawing.Font("Segoe UI Semibold", [float]($Height * 0.13), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $tagFont = New-Object System.Drawing.Font("Segoe UI", [float]($Height * 0.048), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $pillFont = New-Object System.Drawing.Font("Segoe UI Semibold", [float]($Height * 0.035), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

  $creamBrush = New-Object System.Drawing.SolidBrush($cream)
  $mutedBrush = New-Object System.Drawing.SolidBrush($muted)
  $goldBrush = New-Object System.Drawing.SolidBrush($gold)

  $g.DrawString("VIKI CLOW", $brandFont, $creamBrush, $Width * 0.38, $Height * 0.19)
  $g.DrawString("Cursor control, self-authored skills, and multi-device automation.", $tagFont, $mutedBrush, $Width * 0.38, $Height * 0.37)

  $pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 255, 255, 255))
  $pillPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, $gold), 2)
  $labels = @("Skill Factory", "Cursor Control", "Multi-Device Ready")
  for ($i = 0; $i -lt $labels.Count; $i++) {
    $x = $Width * 0.38 + ($i * $Width * 0.18)
    $y = $Height * 0.54
    $w = $Width * 0.16
    $h = $Height * 0.11
    $pill = New-RoundedRectPath -X $x -Y $y -Width $w -Height $h -Radius ($h * 0.42)
    $g.FillPath($pillBrush, $pill)
    $g.DrawPath($pillPen, $pill)
    $g.DrawString($labels[$i], $pillFont, $goldBrush, $x + $w * 0.12, $y + $h * 0.26)
    $pill.Dispose()
  }

  $pillBrush.Dispose()
  $pillPen.Dispose()
  $creamBrush.Dispose()
  $mutedBrush.Dispose()
  $goldBrush.Dispose()
  $brandFont.Dispose()
  $tagFont.Dispose()
  $pillFont.Dispose()

  Save-Png -Bitmap $bmp -Path $Path
  $g.Dispose()
  $bmp.Dispose()
}

function Resize-Master {
  param(
    [string]$SourcePath,
    [int]$Size,
    [string]$TargetPath
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  $target = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($source, 0, 0, $Size, $Size)
  Save-Png -Bitmap $target -Path $TargetPath
  $graphics.Dispose()
  $target.Dispose()
  $source.Dispose()
}

$brandingDir = Join-Path $RepoRoot "assets\branding"
if (-not (Test-Path $brandingDir)) {
  New-Item -ItemType Directory -Path $brandingDir | Out-Null
}

$masterIcon = Join-Path $brandingDir "vikiclow-master.png"
$transparentIcon = Join-Path $brandingDir "vikiclow-foreground-master.png"
$header = Join-Path $brandingDir "vikiclow-header.png"

Draw-Icon -Size 1024 -Path $masterIcon
Draw-Icon -Size 1024 -Path $transparentIcon -TransparentBackground
Draw-Header -Width 1600 -Height 700 -Path $header

$iosIcons = Get-ChildItem -LiteralPath (Join-Path $RepoRoot "apps\ios\Sources\Assets.xcassets\AppIcon.appiconset") -File -Filter *.png
foreach ($icon in $iosIcons) {
  $size = [int][System.IO.Path]::GetFileNameWithoutExtension($icon.Name)
  Resize-Master -SourcePath $masterIcon -Size $size -TargetPath $icon.FullName
}

$androidMap = @{
  "mipmap-mdpi\ic_launcher.png" = 48
  "mipmap-mdpi\ic_launcher_foreground.png" = 108
  "mipmap-hdpi\ic_launcher.png" = 72
  "mipmap-hdpi\ic_launcher_foreground.png" = 162
  "mipmap-xhdpi\ic_launcher.png" = 96
  "mipmap-xhdpi\ic_launcher_foreground.png" = 216
  "mipmap-xxhdpi\ic_launcher.png" = 144
  "mipmap-xxhdpi\ic_launcher_foreground.png" = 324
  "mipmap-xxxhdpi\ic_launcher.png" = 192
  "mipmap-xxxhdpi\ic_launcher_foreground.png" = 432
}

foreach ($relativePath in $androidMap.Keys) {
  $targetPath = Join-Path $RepoRoot ("apps\android\app\src\main\res\" + $relativePath)
  $source = if ($relativePath -like "*foreground*") { $transparentIcon } else { $masterIcon }
  Resize-Master -SourcePath $source -Size $androidMap[$relativePath] -TargetPath $targetPath
}

$macIconPath = Join-Path $RepoRoot "apps\macos\Icon.icon\Assets\vikiclow-mac.png"
Resize-Master -SourcePath $masterIcon -Size 1024 -TargetPath $macIconPath

$readmeHeaderPath = Join-Path $RepoRoot "README-header.png"
Copy-Item -LiteralPath $header -Destination $readmeHeaderPath -Force

Write-Output "Generated VikiClow brand assets."
