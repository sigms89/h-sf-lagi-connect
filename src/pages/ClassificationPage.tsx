// ============================================================
// Húsfélagið.is — ClassificationPage
// Page wrapper for the smart vendor overview / classification UI.
// Resolves the current association and renders VendorOverview.
// ============================================================

import { useCurrentAssociation } from '@/hooks/useAssociation';
import { VendorOverview } from '@/components/classification/VendorOverview';

export default function ClassificationPage() {
  const { data: association } = useCurrentAssociation();
  if (!association) return null;
  return <VendorOverview associationId={association.id} />;
}
