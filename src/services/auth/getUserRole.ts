import { supabase } from "../../supabaseClient";

export const getUserRole = async () => {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) return null;

  const userId = session.session.user.id;

  //  empresa
  const { data: empresa } = await supabase
    .from("empresa")
    .select("id_em")
    .eq("id_em", userId)
    .single();

  if (empresa) return "empresa";

  //  cliente (jovem aprendiz)
  const { data: cliente } = await supabase
    .from("jovem_aprendiz")
    .select("id")
    .eq("id", userId)
    .single();

  if (cliente) return "cliente";

  return null;
};
