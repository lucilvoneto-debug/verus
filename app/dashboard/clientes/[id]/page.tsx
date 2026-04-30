"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useCliente } from "@/hooks/useClientes";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { formatDocumento, formatDate, formatCurrency } from "@/lib/utils";

export default function ClienteDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: cliente, isLoading } = useCliente(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!cliente) return <div className="text-gray-500">Cliente não encontrado.</div>;

  const dados = (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="Tipo" value={cliente.tipo} />
        <Field label="Categoria" value={cliente.categoria} />
        <Field label="Documento" value={formatDocumento(cliente.documento, cliente.tipo)} />
        <Field label="E-mail" value={cliente.email ?? "—"} />
        <Field label="Telefone" value={cliente.telefone ?? "—"} />
        <Field label="WhatsApp" value={cliente.whatsapp ?? "—"} />
        <Field
          label="Endereço"
          value={
            [cliente.logradouro, cliente.numero, cliente.bairro, cliente.cidade, cliente.uf]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />
        <Field label="CEP" value={cliente.cep ?? "—"} />
        <Field label="Cadastrado em" value={formatDate(cliente.createdAt)} />
      </div>
      {cliente.observacoes && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Observações</div>
          <p className="text-sm whitespace-pre-wrap">{cliente.observacoes}</p>
        </div>
      )}
    </Card>
  );

  const atendimentos = (
    <Card>
      {cliente.atendimentos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum atendimento registrado.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {cliente.atendimentos.map((a: { id: string; canal: string; status: string; descricao: string; createdAt: string }) => (
            <li key={a.id} className="py-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge tone="blue">{a.canal}</Badge>
                <Badge tone="neutral">{a.status}</Badge>
                <span className="text-xs text-gray-500 ml-auto">{formatDate(a.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{a.descricao}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const orcamentos = (
    <Card>
      {cliente.orcamentos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum orçamento.</p>
      ) : (
        <table className="table-impermeia">
          <thead>
            <tr>
              <th>Número</th><th>Status</th><th>Total</th><th>Validade</th>
            </tr>
          </thead>
          <tbody>
            {cliente.orcamentos.map((o: { id: string; numero: string; status: string; total: number; dataValidade: string }) => (
              <tr key={o.id}>
                <td className="font-medium">{o.numero}</td>
                <td><Badge tone="neutral">{o.status}</Badge></td>
                <td>{formatCurrency(o.total)}</td>
                <td>{formatDate(o.dataValidade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );

  const obras = (
    <Card>
      {cliente.obras.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma obra.</p>
      ) : (
        <table className="table-impermeia">
          <thead>
            <tr>
              <th>Número</th><th>Nome</th><th>Status</th><th>Início</th><th>Previsão</th>
            </tr>
          </thead>
          <tbody>
            {cliente.obras.map((o: { id: string; numero: string; nome: string; status: string; dataInicio: string; previsaoTermino: string }) => (
              <tr key={o.id}>
                <td className="font-medium">{o.numero}</td>
                <td>{o.nome}</td>
                <td><Badge tone="blue">{o.status}</Badge></td>
                <td>{formatDate(o.dataInicio)}</td>
                <td>{formatDate(o.previsaoTermino)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );

  const anexos = (
    <Card>
      <p className="text-sm text-gray-500">Em desenvolvimento.</p>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clientes" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{cliente.nome}</h2>
          <p className="text-sm text-gray-500">
            {cliente.tipo} · {formatDocumento(cliente.documento, cliente.tipo)}
          </p>
        </div>
        <Link href={`/dashboard/clientes/${cliente.id}/editar`} className="btn-outline">
          <Pencil className="w-4 h-4" /> Editar
        </Link>
      </div>

      <Tabs
        items={[
          { key: "dados", label: "Dados", content: dados },
          { key: "atend", label: `Atendimentos (${cliente.atendimentos.length})`, content: atendimentos },
          { key: "orc", label: `Orçamentos (${cliente.orcamentos.length})`, content: orcamentos },
          { key: "obras", label: `Obras (${cliente.obras.length})`, content: obras },
          { key: "anex", label: "Anexos", content: anexos },
        ]}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
