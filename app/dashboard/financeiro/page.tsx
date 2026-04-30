"use client";

import { Tabs } from "@/components/ui/Tabs";
import { ContasReceberTab } from "@/components/financeiro/ContasReceberTab";
import { ContasPagarTab } from "@/components/financeiro/ContasPagarTab";
import { FluxoCaixaTab } from "@/components/financeiro/FluxoCaixaTab";

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-dark">Financeiro</h2>
        <p className="text-sm text-gray-500">
          Contas a receber, contas a pagar e fluxo de caixa.
        </p>
      </div>

      <Tabs
        items={[
          { key: "receber", label: "Contas a Receber", content: <ContasReceberTab /> },
          { key: "pagar", label: "Contas a Pagar", content: <ContasPagarTab /> },
          { key: "fluxo", label: "Fluxo de Caixa", content: <FluxoCaixaTab /> },
        ]}
      />
    </div>
  );
}
