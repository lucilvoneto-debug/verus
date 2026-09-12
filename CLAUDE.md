## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

### Observações desta instalação (medidas em 06/09/2026)

- **`graphify update .` derruba os nomes das áreas.** Ele re-agrupa o grafo e renomeia as
  comunidades pelo arquivo mais conectado de cada uma. Nomes curados viram nome de arquivo.
  Isso é da ferramenta, não tem conserto local. As consultas continuam corretas, porque elas
  citam caminho de arquivo real; só a etiqueta da área fica pior. Para recuperar os nomes é
  preciso rodar `graphify label`, que **usa IA e custa**. O gancho post-commit roda esse mesmo update a cada gravação,
  então os nomes degradam sozinhos ao longo do tempo. Conferido em 06/09: o gancho
  dispara mesmo neste diretório. Nome de área é enfeite: não
  tome decisão com base nele, use o caminho do arquivo citado na consulta.
- **A busca casa texto, não sentido.** Pergunta concreta funciona ("webhook do WhatsApp",
  "renovação de contrato"); pergunta abstrata ("arquitetura geral") devolve pouco ou nada.
  Prefira nomear o assunto do jeito que ele aparece no código.
- **`.graphifyignore` exclui o manual do próprio graphify.** Sem isso, `.claude/skills/graphify/`
  entra no grafo e responde às consultas no lugar do projeto. Não remova essas linhas.
- **Documento, política e imagem não entram no update automático.** Só código entra. Para
  documento novo, peça `/graphify --update`, que usa IA e custa.
- **O log `~/.cache/graphify-rebuild.log` é da máquina inteira**, não deste projeto. Linhas nele podem ter vindo de outro repositório; não sirva de prova de que o gancho rodou aqui.
