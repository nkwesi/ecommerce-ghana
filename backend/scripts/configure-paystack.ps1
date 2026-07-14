param(
    [string]$EnvPath = (Join-Path $PSScriptRoot '..\.env')
)

$ErrorActionPreference = 'Stop'

function Set-DotEnvValue {
    param(
        [string]$Content,
        [string]$Name,
        [string]$Value
    )

    $pattern = '(?m)^' + [Regex]::Escape($Name) + '=.*$'
    $replacement = "$Name=$Value"

    if ([Regex]::IsMatch($Content, $pattern)) {
        return [Regex]::Replace(
            $Content,
            $pattern,
            [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $replacement }
        )
    }

    if (-not $Content.EndsWith("`n")) {
        $Content += [Environment]::NewLine
    }

    return $Content + $replacement + [Environment]::NewLine
}

$secureKey = Read-Host 'Paste your Paystack TEST secret key (input is hidden)' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
$secretKey = $null

try {
    $secretKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)

    if (-not $secretKey.StartsWith('sk_test_')) {
        throw 'Expected a Paystack test secret key beginning with sk_test_.'
    }

    Write-Host 'Validating the test key with Paystack...'
    $response = Invoke-RestMethod `
        -Method Get `
        -Uri 'https://api.paystack.co/transaction?perPage=1' `
        -Headers @{ Authorization = "Bearer $secretKey" }

    if (-not $response.status) {
        throw 'Paystack did not accept the supplied test key.'
    }

    $resolvedEnvPath = [IO.Path]::GetFullPath($EnvPath)
    if (-not [IO.File]::Exists($resolvedEnvPath)) {
        throw "Environment file not found: $resolvedEnvPath"
    }

    $content = [IO.File]::ReadAllText($resolvedEnvPath)
    $content = Set-DotEnvValue -Content $content -Name 'PAYSTACK_SECRET_KEY' -Value $secretKey
    $content = Set-DotEnvValue -Content $content -Name 'PAYMENT_MODE' -Value 'paystack'
    [IO.File]::WriteAllText(
        $resolvedEnvPath,
        $content,
        (New-Object Text.UTF8Encoding($false))
    )

    $markerPath = Join-Path $env:TEMP 'ecommerce-ghana-paystack-configured.txt'
    [IO.File]::WriteAllText($markerPath, (Get-Date).ToString('o'))

    Write-Host ''
    Write-Host 'Paystack test mode is connected successfully.' -ForegroundColor Green
    Write-Host 'You can close this terminal window.'
} catch {
    Write-Host ''
    Write-Host "Paystack configuration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'No Paystack configuration was saved.'
    exit 1
} finally {
    if ($secretPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    }
    $secretKey = $null
    $secureKey = $null
}

