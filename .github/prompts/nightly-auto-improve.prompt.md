Review the latest quality signals for this repository and make at most one focused, low-risk improvement.

Available context:

- `.artifacts/nightly-context.md`
- `.artifacts/flaker-review.md`
- `.artifacts/vrt-summary.md`
- `.artifacts/playwright-report.json` when present

Required behavior:

1. Read the quality artifacts first.
2. Choose one concrete improvement only if it is safe and justified by the signals.
3. Prefer fixes or cleanups in the dashboard, API, contracts, or tests that reduce review debt without changing product intent.
4. Re-run the smallest relevant validation set after editing.
5. If no safe change is warranted, leave the tree unchanged and explain why in the final message.

Constraints:

- Do not edit GitHub workflow structure unless it is directly required to make the quality lane work.
- Do not upgrade dependencies broadly.
- Keep visual baselines stable unless the change clearly requires a baseline refresh.
- Avoid speculative refactors.

Summarize:

- what you changed
- why you chose it
- what you re-ran
- any remaining risk
