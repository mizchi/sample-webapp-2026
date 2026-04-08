import type { DeploymentPoint } from "../../../../packages/contracts/src/index.ts";

export function DeploymentRail({ points }: { points: DeploymentPoint[] }) {
  return (
    <div className="deployment-rail">
      {points.map((point) => (
        <div key={point.label} className="deployment-column">
          <div className="deployment-bars" aria-hidden="true">
            <span className="bar deployed" style={{ height: `${point.deployed * 7}px` }} />
            <span className="bar blocked" style={{ height: `${Math.max(point.blocked, 1) * 12}px` }} />
          </div>
          <div className="deployment-meta">
            <span>{point.label}</span>
            <small>{point.deployed} shipped</small>
          </div>
        </div>
      ))}
    </div>
  );
}
