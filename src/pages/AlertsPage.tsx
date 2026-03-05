// ============================================================
// Húsfélagið.is — Alerts Page wrapper
// ============================================================

import { useCurrentAssociation } from '@/hooks/useAssociation';
import { AlertsPanel } from '@/components/alerts/AlertsPanel';

export default function AlertsPage() {
  const { data: association } = useCurrentAssociation();
  if (!association) return null;
  return <AlertsPanel associationId={association.id} />;
}
