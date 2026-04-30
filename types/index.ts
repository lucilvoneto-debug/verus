export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ClienteListItem = {
  id: string;
  tipo: "PF" | "PJ";
  nome: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  categoria: string;
  createdAt: string;
};

export type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

export type SidebarItem = {
  label: string;
  href: string;
  iconName: string;
};

export type KpiTone = "blue" | "green" | "yellow" | "red" | "neutral";
