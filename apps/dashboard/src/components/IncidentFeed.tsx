import type {
  DashboardFilter,
  Incident,
} from "../../../../packages/contracts/src/index.ts";

const filters: DashboardFilter[] = ["all", "critical", "warning", "watch"];

export function IncidentFeed(input: {
  incidents: Incident[];
  activeFilter: DashboardFilter;
  onFilterChange: (next: DashboardFilter) => void;
  onFocusService: (serviceId: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="kicker">Incident lane</p>
          <h2>Active customer pressure</h2>
        </div>
        <div className="filter-strip" role="group" aria-label="Incident severity filter">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={filter === input.activeFilter ? "filter-pill active" : "filter-pill"}
              onClick={() => input.onFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <ul className="incident-list">
        {input.incidents.map((incident) => (
          <li key={incident.id} className={`incident-card severity-${incident.severity}`}>
            <div className="incident-meta">
              <span className="severity-chip">{incident.severity}</span>
              <span>{incident.openedAt}</span>
            </div>
            <h3>{incident.title}</h3>
            <p>{incident.note}</p>
            <div className="incident-footer">
              <span>{incident.serviceName}</span>
              <span>{incident.owner}</span>
              <button type="button" onClick={() => input.onFocusService(incident.serviceId)}>
                Inspect service
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
