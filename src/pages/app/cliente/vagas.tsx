import { Sidebar } from "../../../components/sideBar/sideBar";
import React, { useEffect, useState } from "react";
import styles from "./vagas.module.css";
import { supabase } from "../../../supabaseClient";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
interface Vaga {
  id_vag: string;
  id_em: string;
  titulo: string;
  descricao: string;
  carga_horaria: number;
  salario: number;
  data_publicada: string;
}

const Vagas: React.FC = () => {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useDocumentTitle("CIJA - Vagas Disponíveis");
  const [userId, setUserId] = useState<string | null>(null);
  // Estado para armazenar IDs das vagas que o usuário já se candidatou
  const [minhasCandidaturas, setMinhasCandidaturas] = useState<string[]>([]);

  useEffect(() => {
    async function inicializar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Busca as candidaturas existentes desse usuário
        const { data } = await supabase
          .from("candidaturas")
          .select("id_vaga")
          .eq("id_candidato", user.id);
        
        if (data) {
          setMinhasCandidaturas(data.map(c => c.id_vaga));
        }
      }
      await buscarVagas();
    }
    inicializar();
  }, []);

  async function buscarVagas() {
    const { data, error } = await supabase
      .from("vaga")
      .select("*")
      .order("data_publicada", { ascending: false });

    if (error) {
      console.error("Erro ao buscar vagas:", error);
      return;
    }

    setVagas(data as Vaga[]);
    setLoading(false);
  }

  async function candidatarSe(idVaga: string) {
    if (!userId) {
      alert("Você precisa estar logado para se candidatar.");
      return;
    }

    const { error } = await supabase
      .from("candidaturas")
      .insert([{ id_vaga: idVaga, id_candidato: userId }]);

    if (error) {
      if (error.code === '23505') {
        alert("Você já se candidatou a esta vaga!");
      } else {
        alert("Erro ao enviar candidatura. Verifique suas tabelas no Supabase.");
        console.error(error);
      }
    } else {
      alert("Candidatura realizada com sucesso!");
      // Atualiza a lista local adicionando a nova candidatura instantaneamente
      setMinhasCandidaturas(prev => [...prev, idVaga]);
    }
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.header}>
          <h1>Vagas Disponíveis</h1>
          <p>Encontre oportunidades para jovem aprendiz e estágio.</p>
        </div>

        {loading ? (
          <p className={styles.loading}>Carregando vagas...</p>
        ) : vagas.length === 0 ? (
          <p>Nenhuma vaga encontrada.</p>
        ) : (
          <div className={styles.vagasGrid}>
            {vagas.map((vaga) => {
              const jaCandidatado = minhasCandidaturas.includes(vaga.id_vag);
              
              return (
                <div key={vaga.id_vag} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2>{vaga.titulo}</h2>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.descricao}>{vaga.descricao}</p>
                    <div className={styles.info}>
                      <span>{vaga.carga_horaria}h semanais</span>
                      <span>R$ {vaga.salario}</span>
                    </div>
                    <p className={styles.data}>
                      Publicada em {new Date(vaga.data_publicada).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  
                  <button 
                    className={jaCandidatado ? `${styles.botao} ${styles.candidatado}` : styles.botao} 
                    onClick={() => !jaCandidatado && candidatarSe(vaga.id_vag)}
                    style={{
                      backgroundColor: jaCandidatado ? "#10b981" : "", // Muda para Verde se cadastrado
                      cursor: jaCandidatado ? "default" : "pointer"
                    }}
                    disabled={jaCandidatado}
                  >
                    {jaCandidatado ? "✓ Candidatado" : "Candidatar-se"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Vagas;