import { Button } from "@/components/ui/button";
import { ExportButton } from "./export-button";

export interface DateRangeFormProps {
  from: string;
  to: string;
}

export function DateRangeForm({ from, to }: DateRangeFormProps) {
  return (
    <form className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col">
        <label className="mb-1.5 text-[11.5px] tracking-wide text-text-secondary uppercase">Start date</label>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-md border border-border bg-surface-2 px-2.5 py-2 font-mono text-[13px] text-text-primary"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1.5 text-[11.5px] tracking-wide text-text-secondary uppercase">End date</label>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded-md border border-border bg-surface-2 px-2.5 py-2 font-mono text-[13px] text-text-primary"
        />
      </div>
      <Button type="submit">Apply</Button>
      <div className="ml-auto">
        <ExportButton from={from} to={to} />
      </div>
    </form>
  );
}
