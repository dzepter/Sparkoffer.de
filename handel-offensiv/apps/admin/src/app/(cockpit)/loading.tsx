import { LoadingState } from "@/components/ui/loading-state";

export default function CockpitLoading() {
  return (
    <div className="space-y-4">
      <LoadingState label="Übersicht wird geladen …" rows={2} />
      <LoadingState rows={4} />
    </div>
  );
}
