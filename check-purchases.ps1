try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3001/purchases' -UseBasicParsing -TimeoutSec 60
    Write-Output ("STATUS: " + $r.StatusCode)
    Write-Output ("CONTENT-LENGTH: " + $r.Content.Length)
} catch {
    Write-Output ("ERROR: " + $_.Exception.Message)
}
