# Simple static file server for Vantage Portal
param([int]$Port = 3000)

$root = $PSScriptRoot
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.ttf'  = 'font/ttf'
}

while ($listener.IsListening) {
  $ctx  = $listener.GetContext()
  $req  = $ctx.Request
  $resp = $ctx.Response

  $urlPath = $req.Url.AbsolutePath
  # Default to index.html
  if ($urlPath -eq '/') { $urlPath = '/index.html' }

  $filePath = Join-Path $root ($urlPath.TrimStart('/').Replace('/', '\'))

  # If directory, try index.html inside it
  if (Test-Path $filePath -PathType Container) {
    $filePath = Join-Path $filePath 'index.html'
  }

  if (Test-Path $filePath -PathType Leaf) {
    $ext  = [System.IO.Path]::GetExtension($filePath).ToLower()
    $mime = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $resp.ContentType   = $mime
    $resp.ContentLength64 = $bytes.Length
    $resp.StatusCode    = 200
    $resp.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $msg   = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
    $resp.StatusCode    = 404
    $resp.ContentType   = 'text/plain'
    $resp.ContentLength64 = $msg.Length
    $resp.OutputStream.Write($msg, 0, $msg.Length)
  }

  $resp.OutputStream.Close()
}
