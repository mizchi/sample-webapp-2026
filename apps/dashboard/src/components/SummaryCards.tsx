import type { SummaryMetric } from "../../../../packages/contracts/src/index.ts";

export function SummaryCards({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <section className="summary-grid" aria-label="Operations summary">
      {metrics.map((metric) => (
        <article key={metric.id} className={`summary-card status-${metric.status}`}>
          <p className="summary-title">{metric.title}</p>
          <div className="summary-row">
            <strong>{metric.value}</strong>
            <span>{metric.delta}</span>
          </div>
          <p className="summary-caption">{metric.caption}</p>
        </article>
      ))}
    </section>
  );
}
