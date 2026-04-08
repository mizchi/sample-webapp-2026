import type { Recommendation } from "../../../../packages/contracts/src/index.ts";

export function RecommendationRail({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="kicker">Auto-improve queue</p>
          <h2>Safe next moves</h2>
        </div>
      </div>
      <div className="recommendation-stack">
        {recommendations.map((recommendation) => (
          <article key={recommendation.id} className="recommendation-card">
            <div className="recommendation-head">
              <h3>{recommendation.title}</h3>
              <span>{Math.round(recommendation.confidence * 100)}%</span>
            </div>
            <p>{recommendation.rationale}</p>
            <strong>{recommendation.action}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
