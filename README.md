# archivacloud-p05
# P-05 
# Benjamin Gonzalez - Elias Rodrigez

P-05 
PDF, JPG 
12 
archivacloud-p05 us-east-1 
Mostrar un contador de "archivos subidos esta semana" en la pantalla principal.

# Stack

backend: Python(FastApi) 3.14.5
frontend: react 19.2.6 + vite v8.0.16 + css3 

# Cors

[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]

# npm audit
1 high severity vulnerability

To address all issues, run:
  npm audit fix
  npm audit report

form-data  4.0.0 - 4.0.5
Severity: high
form-data: CRLF injection in form-data via unescaped multipart field names and filenames - https://github.com/advisories/GHSA-hmw2-7cc7-3qxx
fix available via `npm audit fix`
node_modules/form-data
1 high severity vulnerability
(Mitigada)


# pip-audit
Found 3 known vulnerabilities in 2 packages
Name      Version ID             Fix Versions
--------- ------- -------------- ------------
pip       26.1.1  PYSEC-2026-196 26.1.2
starlette 1.2.1   CVE-2026-54283 1.3.1
starlette 1.2.1   CVE-2026-54282 1.3.0