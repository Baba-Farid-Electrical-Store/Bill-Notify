# Contributing

Thanks for helping improve BillNotify. Keep changes focused and explain the user or maintenance problem they solve.

## Before opening a pull request

1. Open an issue first for large changes or changes that affect invoice, SMS, authentication, or database behavior.
2. Keep credentials, real phone numbers, invoice links, customer details, and production logs out of commits and screenshots.
3. Run the relevant checks locally:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

4. Update the README when setup, environment variables, or deployment steps change.
5. Describe risks and manual setup steps in the pull request. Include screenshots only when they contain no private data.

The CI workflow runs lint, type checks, and unit tests on pushes and pull requests to `main` and `master`.
