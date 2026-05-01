import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CampoSignOutFull } from "@/components/campo/CampoSignOutFull";

export const dynamic = "force-dynamic";

export default async function CampoPerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const colaborador = await prisma.colaborador.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-brand-dark">Perfil</h1>
      </div>

      <div className="card space-y-3">
        <div>
          <p className="text-xs text-gray-500">Nome</p>
          <p className="text-base font-medium text-gray-800">{session.user.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">E-mail</p>
          <p className="text-sm text-gray-700 break-all">{session.user.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Perfil de acesso</p>
          <p className="text-sm text-gray-700">{session.user.role || "—"}</p>
        </div>
        {colaborador && (
          <>
            <hr />
            <div>
              <p className="text-xs text-gray-500">Função</p>
              <p className="text-sm text-gray-700">{colaborador.funcao}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Telefone</p>
              <p className="text-sm text-gray-700">{colaborador.telefone || "—"}</p>
            </div>
          </>
        )}
      </div>

      <CampoSignOutFull />
    </div>
  );
}
