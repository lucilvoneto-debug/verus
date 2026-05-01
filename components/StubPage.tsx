import { Card, CardTitle } from "@/components/ui/Card";
import { Construction } from "lucide-react";

export function StubPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-dark">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>

      <Card className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mb-4">
          <Construction className="w-7 h-7" />
        </div>
        <CardTitle>Em desenvolvimento</CardTitle>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          Este módulo faz parte do roadmap do Verus ERP. A interface e as integrações
          serão entregues em breve.
        </p>
      </Card>
    </div>
  );
}
