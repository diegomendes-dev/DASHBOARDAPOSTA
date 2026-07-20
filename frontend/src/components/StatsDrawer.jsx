import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";

export default function StatsDrawer({ isOpen, onClose, apostas, todasApostas, bankroll, onUpdate }) {
  const [modalTransacao, setModalTransacao] = useState(false);
  const [casaSelecionada, setCasaSelecionada] = useState(null);
  const [tipoTransacao, setTipoTransacao] = useState("deposito");
  const [valorTransacao, setValorTransacao] = useState("");
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().split("T")[0]);
  const [horaTransacao, setHoraTransacao] = useState(new Date().toTimeString().substring(0, 5));
  const [transacoes, setTransacoes] = useState([]);

  useEffect(() => {
    if (isOpen && bankroll) carregarHistorico();
  }, [isOpen, bankroll]);

  const carregarHistorico = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/bankrolls/${bankroll.id}/transacoes`);
      setTransacoes(await res.json());
    } catch (error) { console.error("Erro ao buscar transações:", error); }
  };

  if (!isOpen || !bankroll) return null;

  const arrayReal = todasApostas || apostas;
  const lucroTotalReal = arrayReal.reduce((acc, aposta) => acc + Number(aposta.lucro_obtido), 0);
  const capitalAtual = bankroll.capital_inicial + lucroTotalReal;

  const totalApostas = apostas.length;
  const lucroTotal = apostas.reduce((acc, aposta) => acc + Number(aposta.lucro_obtido), 0);
  const roi = bankroll.capital_inicial > 0 ? (lucroTotal / bankroll.capital_inicial) * 100 : 0;
  
  const vencedoras = apostas.filter(a => a.status_geral === "Ganha").length;
  const perdedoras = apostas.filter(a => a.status_geral === "Perdida").length;
  const reembolsadas = apostas.filter(a => a.status_geral === "Reembolsada").length;
  const pendentes = apostas.filter(a => a.status_geral === "Pendente").length;
  
  const totalResolvidas = vencedoras + perdedoras;
  const taxaSucesso = totalResolvidas > 0 ? (vencedoras / totalResolvidas) * 100 : 0;

  const lucros = apostas.map(a => Number(a.lucro_obtido));
  const maiorLucro = lucros.length > 0 ? Math.max(...lucros, 0) : 0;
  const maiorPerda = lucros.length > 0 ? Math.min(...lucros, 0) : 0;
  const valorInvestidoTotal = apostas.reduce((acc, a) => acc + Number(a.valor_investido), 0);
  const valorMedioAposta = totalApostas > 0 ? valorInvestidoTotal / totalApostas : 0;

  const calcularSaldoDisponivelCasa = (casa) => {
    let saldoDisponivel = Number(casa.saldo_atual);
    const apostasDaCasa = arrayReal.filter(a => a.casa_aposta_id === casa.id);
    apostasDaCasa.forEach((aposta) => {
      if (aposta.status_geral === "Pendente") saldoDisponivel -= Number(aposta.valor_investido);
      else saldoDisponivel += Number(aposta.lucro_obtido);
    });
    return saldoDisponivel;
  };

  const abrirModalTransacao = (casa, tipo) => {
    setCasaSelecionada(casa); setTipoTransacao(tipo); setValorTransacao("");
    setDataTransacao(new Date().toISOString().split("T")[0]);
    setHoraTransacao(new Date().toTimeString().substring(0, 5));
    setModalTransacao(true);
  };

  const handleTransacao = async (e) => {
    e.preventDefault();
    if (!valorTransacao || Number(valorTransacao) <= 0) return;
    try {
      const dataHoraIso = `${dataTransacao}T${horaTransacao}:00`;
      await fetch(`http://localhost:3000/api/casas/${casaSelecionada.id}/transacao`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankroll_id: bankroll.id, tipo: tipoTransacao, valor: Number(valorTransacao), data_hora: dataHoraIso })
      });
      setModalTransacao(false); carregarHistorico(); if (onUpdate) onUpdate();
    } catch (error) { console.error("Erro na transação:", error); }
  };

  return (
    <Overlay onClick={onClose}>
      <Drawer onClick={(e) => e.stopPropagation()}>
        <DrawerHeader>
          <h2>Estatísticas Detalhadas</h2>
          <button onClick={onClose}>×</button>
        </DrawerHeader>

        <Grid>
          <StatBox><span className="title">Apostas (Filtro)</span><span className="val text-blue">{totalApostas}</span></StatBox>
          <StatBox><span className="title">Lucros (Filtro)</span><span className={`val ${lucroTotal > 0 ? 'text-green' : lucroTotal < 0 ? 'text-red' : ''}`}>{lucroTotal.toFixed(2)}R$</span></StatBox>
          <StatBox><span className="title">ROI (Filtro)</span><span className={`val ${roi > 0 ? 'text-green' : roi < 0 ? 'text-red' : ''}`}>{roi.toFixed(2)}%</span></StatBox>
          <StatBox><span className="title">Sucesso %</span><span className="val text-green">{taxaSucesso.toFixed(2)}%</span></StatBox>
          <StatBox><span className="title">Capital inicial</span><span className="val">{bankroll.capital_inicial.toFixed(2)}R$</span></StatBox>
          <StatBox><span className="title">Capital atual</span><span className="val">{capitalAtual.toFixed(2)}R$</span></StatBox>
          <StatBox><span className="title">Vencedoras</span><span className="val text-green">{vencedoras}</span></StatBox>
          <StatBox><span className="title">Perdedoras</span><span className="val text-red">{perdedoras}</span></StatBox>
          <StatBox><span className="title">Reembolsadas</span><span className="val text-blue">{reembolsadas}</span></StatBox>
          <StatBox><span className="title">Em curso</span><span className="val">{pendentes}</span></StatBox>
          <StatBox><span className="title">Valor médio</span><span className="val">{valorMedioAposta.toFixed(2)}R$</span></StatBox>
          <StatBox><span className="title">Valor em jogo</span><span className="val">{valorInvestidoTotal.toFixed(2)}R$</span></StatBox>
          <StatBox><span className="title">Maior lucro</span><span className="val text-green">{maiorLucro.toFixed(2)}R$</span></StatBox>
          <StatBox><span className="title">Maior perda</span><span className="val text-red">{maiorPerda.toFixed(2)}R$</span></StatBox>
        </Grid>

        <SectionTitle>Capital disponível por casa (Real)</SectionTitle>
        <Grid style={{ gridTemplateColumns: '1fr' }}>
          {bankroll.casas && bankroll.casas.map((casa) => {
            const saldoDinamico = calcularSaldoDisponivelCasa(casa);
            return (
              <CasaBox key={casa.id}>
                <div className="header">
                  <span className="title">{casa.nome_casa}</span>
                  <span className="value">{saldoDinamico.toFixed(2)}R$</span>
                </div>
                <div className="actions">
                  <BtnDeposit onClick={() => abrirModalTransacao(casa, "deposito")}>+ Depositar</BtnDeposit>
                  <BtnWithdraw onClick={() => abrirModalTransacao(casa, "retirada")}>- Retirar</BtnWithdraw>
                </div>
              </CasaBox>
            );
          })}
        </Grid>

        <SectionTitle>Histórico de Movimentações</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '30px' }}>
          {transacoes.length === 0 ? (
            <span style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Nenhuma movimentação financeira.</span>
          ) : (
            transacoes.map((t) => (
              <HistoryItem key={t.id}>
                <div>
                  <span className="title">{t.nome_casa}</span>
                  <span className="date">{new Date(t.data_hora).toLocaleDateString("pt-BR")} às {new Date(t.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`val ${t.tipo === "deposito" ? "text-green" : "text-red"}`}>
                    {t.tipo === "deposito" ? "+" : "-"}{t.valor.toFixed(2)} R$
                  </span>
                  <span className="type">{t.tipo === "deposito" ? "Depósito" : "Saque"}</span>
                </div>
              </HistoryItem>
            ))
          )}
        </div>
      </Drawer>

      {/* MODAL SOBREPOSTO - DEPÓSITO / SAQUE */}
      {modalTransacao && (
        <ModalOverlay onClick={() => setModalTransacao(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px' }}>{tipoTransacao === "deposito" ? "Depositar na" : "Retirar da"} {casaSelecionada?.nome_casa}</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }} onClick={() => setModalTransacao(false)}>×</button>
            </div>
            <form onSubmit={handleTransacao}>
              <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}><InputLabel>Data</InputLabel><Input type="date" required value={dataTransacao} onChange={(e) => setDataTransacao(e.target.value)} /></div>
                <div style={{ flex: 1 }}><InputLabel>Hora</InputLabel><Input type="time" required value={horaTransacao} onChange={(e) => setHoraTransacao(e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <InputLabel>Valor da Transação (R$)</InputLabel>
                <Input type="number" step="0.01" required value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)} placeholder="Ex: 100.00" />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <BtnCancel type="button" onClick={() => setModalTransacao(false)}>Cancelar</BtnCancel>
                <BtnConfirm type="submit" $isDeposit={tipoTransacao === 'deposito'}>Confirmar</BtnConfirm>
              </div>
            </form>
          </ModalBox>
        </ModalOverlay>
      )}
    </Overlay>
  );
}

// --- STYLED COMPONENTS ---
const slideIn = keyframes`from { transform: translateX(100%); } to { transform: translateX(0); }`;
const Overlay = styled.div`position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1050; display: flex; justify-content: flex-end;`;
const Drawer = styled.div`background: #f9fafb; width: 100%; max-width: 480px; height: 100%; box-shadow: -4px 0 15px rgba(0,0,0,0.1); overflow-y: auto; padding: 25px; animation: ${slideIn} 0.3s ease-out;`;
const DrawerHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; button { font-size: 28px; color: #9ca3af; &:hover { color: #374151; } }`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 10px;`;
const StatBox = styled.div`
  background: #fff; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;
  .title { font-size: 11px; color: #6b7280; font-weight: 600; }
  .val { font-size: 14px; font-weight: bold; }
  .text-blue { color: #3b82f6; } .text-green { color: #10b981; } .text-red { color: #ef4444; }
`;
const SectionTitle = styled.h3`font-size: 15px; color: #374151; margin-top: 30px; margin-bottom: 15px; font-weight: bold;`;
const CasaBox = styled.div`
  background: #fff; border: 1px solid #e5e7eb; padding: 16px 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px;
  .header { display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 13px; color: #6b7280; font-weight: 500; }
  .value { font-size: 16px; color: #333; font-weight: bold; }
  .actions { display: flex; gap: 8px; }
`;
const BtnDeposit = styled.button`flex: 1; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid #10b981; border-radius: 4px; padding: 6px 0; font-size: 12px; font-weight: bold; cursor: pointer;`;
const BtnWithdraw = styled.button`flex: 1; background: rgba(244,63,94,0.1); color: #f43f5e; border: 1px solid #f43f5e; border-radius: 4px; padding: 6px 0; font-size: 12px; font-weight: bold; cursor: pointer;`;
const HistoryItem = styled.div`
  display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 15px; border-radius: 8px; border: 1px solid #e5e7eb;
  .title { font-size: 13px; font-weight: bold; color: #374151; display: block; }
  .date { font-size: 11px; color: #6b7280; }
  .val { font-size: 14px; font-weight: 900; }
  .text-green { color: #10b981; } .text-red { color: #f43f5e; }
  .type { display: block; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-top: 2px; }
`;
const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1100;`;
const ModalBox = styled.div`background: #fff; padding: 25px; border-radius: 10px; width: 100%; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;
const InputLabel = styled.label`display: block; font-size: 13px; color: #4b5563; margin-bottom: 6px; font-weight: 500;`;
const Input = styled.input`width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; &:focus { border-color: #6366f1; }`;
const BtnCancel = styled.button`background: #f3f4f6; color: #374151; border: none; padding: 10px 15px; border-radius: 6px; font-weight: 600; cursor: pointer;`;
const BtnConfirm = styled.button`background: ${props => props.$isDeposit ? '#10b981' : '#f43f5e'}; color: #fff; border: none; padding: 10px 15px; border-radius: 6px; font-weight: 600; cursor: pointer;`;