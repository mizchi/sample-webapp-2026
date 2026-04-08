import type {
  ServiceCard,
  ServiceDetail,
} from "../../../../packages/contracts/src/index.ts";

function formatSaturation(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function ServicePanel(input: {
  services: ServiceCard[];
  selectedServiceId: string | null;
  detail: ServiceDetail | null;
  onSelectService: (serviceId: string) => void;
  onClose: () => void;
}) {
  return (
    <section className="panel service-panel">
      <div className="panel-header">
        <div>
          <p className="kicker">Service slice</p>
          <h2>Focus a system</h2>
        </div>
      </div>

      <div className="service-list" role="list" aria-label="Service cards">
        {input.services.map((service) => (
          <button
            key={service.id}
            type="button"
            className={service.id === input.selectedServiceId ? "service-card active" : "service-card"}
            onClick={() => input.onSelectService(service.id)}
          >
            <div>
              <span className={`service-status status-${service.status}`} />
              <strong>{service.name}</strong>
            </div>
            <small>{service.owner}</small>
            <dl>
              <div>
                <dt>Latency</dt>
                <dd>{service.latencyMs}ms</dd>
              </div>
              <div>
                <dt>Error</dt>
                <dd>{service.errorRate}%</dd>
              </div>
              <div>
                <dt>Saturation</dt>
                <dd>{formatSaturation(service.saturation)}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>

      <aside className="service-drawer" aria-live="polite">
        {input.detail ? (
          <>
            <div className="service-drawer-header">
              <div>
                <p className="kicker">Focused system</p>
                <h3>{input.detail.name}</h3>
              </div>
              <button type="button" className="ghost-button" onClick={input.onClose}>
                Close
              </button>
            </div>
            <p className="service-runbook">
              Runbook:
              {" "}
              <a href={input.detail.runbook}>{input.detail.runbook}</a>
            </p>
            <ul className="service-notes">
              {input.detail.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <div className="release-stack">
              {input.detail.releases.map((release) => (
                <div key={release.id} className="release-card">
                  <div>
                    <strong>{release.label}</strong>
                    <span>{release.startedAt}</span>
                  </div>
                  <span>{release.status}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="service-empty">
            <p>Select a service card or incident to inspect rollout context.</p>
          </div>
        )}
      </aside>
    </section>
  );
}
