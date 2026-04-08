import { useEffect, useState, useTransition } from "react";
import type {
  DashboardFilter,
  DashboardSnapshot,
  ServiceDetail,
} from "../../../../packages/contracts/src/index.ts";
import {
  fetchDashboardSnapshot,
  fetchServiceDetail,
} from "../lib/dashboard-client.ts";
import { writeViewState } from "../lib/view-state.ts";

export interface DashboardController {
  snapshot: DashboardSnapshot | null;
  serviceDetail: ServiceDetail | null;
  severity: DashboardFilter;
  focusServiceId: string | null;
  isPending: boolean;
  error: string | null;
  selectSeverity: (next: DashboardFilter) => void;
  focusService: (serviceId: string | null) => void;
  refresh: () => void;
}

export function useDashboardController(input: {
  initialSeverity: DashboardFilter;
  initialFocusServiceId: string | null;
}): DashboardController {
  const [severity, setSeverity] = useState(input.initialSeverity);
  const [focusServiceId, setFocusServiceId] = useState<string | null>(input.initialFocusServiceId);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setError(null);

    fetchDashboardSnapshot(severity)
      .then((next) => {
        if (!cancelled) {
          setSnapshot(next);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : String(nextError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [severity, reloadToken]);

  useEffect(() => {
    let cancelled = false;

    if (!focusServiceId) {
      setServiceDetail(null);
      return () => {
        cancelled = true;
      };
    }

    fetchServiceDetail(focusServiceId)
      .then((next) => {
        if (!cancelled) {
          setServiceDetail(next);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : String(nextError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [focusServiceId]);

  useEffect(() => {
    writeViewState({ severity, focusServiceId });
  }, [severity, focusServiceId]);

  return {
    snapshot,
    serviceDetail,
    severity,
    focusServiceId,
    isPending,
    error,
    selectSeverity(next) {
      startTransition(() => {
        setSeverity(next);
      });
    },
    focusService(serviceId) {
      startTransition(() => {
        setFocusServiceId(serviceId);
      });
    },
    refresh() {
      startTransition(() => {
        setReloadToken((current) => current + 1);
      });
    },
  };
}
