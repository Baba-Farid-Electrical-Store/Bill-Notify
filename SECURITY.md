# Security policy

## Reporting a vulnerability

Please report security issues privately through [GitHub's private vulnerability reporting](https://github.com/Baba-Farid-Electrical-Store/Bill-Notify/security/advisories/new). Do not open a public issue for a vulnerability.

Include the affected area, the steps needed to reproduce the issue, and its possible impact. Use placeholder data. Do not send passwords, API keys, real customer information, or unredacted production logs.

## Secret handling

- Keep `.env.local` and provider credentials out of Git.
- If a credential is exposed, revoke or rotate it with its provider and notify the repository owner privately.
- Avoid sharing invoice links, phone numbers, or customer records in issues and pull requests.
