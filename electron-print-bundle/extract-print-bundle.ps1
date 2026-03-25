# Trích "Print bundle" từ MEULayout.html — HTML + CSS + BatchImageConverter + InteractivePreview
# Không gồm: File System Section, Auto Print, A4 Test (từ khoảng dòng 66951 trong file gốc).
# Chạy: powershell -ExecutionPolicy Bypass -File "e:\MEU Layout\electron-print-bundle\extract-print-bundle.ps1"

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$src = Join-Path $root 'MEULayout.html'
if (-not (Test-Path -LiteralPath $src)) {
    Write-Error "Không tìm thấy: $src"
}

$dstDir = $PSScriptRoot
$lines = Get-Content -LiteralPath $src -Encoding UTF8
# 1..31488: từ đầu file đến hết modal preset (trước <script> lớn)
$partA = $lines[0..31487]
# 31490..66949: script chính (BatchImageConverter + SK316 + ...) + script InteractivePreview
$partB = $lines[31489..66948]
$out = $partA + $partB + '</body>', '</html>'
$outPath = Join-Path $dstDir 'MEULayout-print-only.html'
Set-Content -LiteralPath $outPath -Value $out -Encoding UTF8
Write-Host "Đã ghi: $outPath ($((Get-Item $outPath).Length) bytes)"
