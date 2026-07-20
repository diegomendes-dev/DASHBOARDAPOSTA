import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import DashboardLayout from "../components/DashboardLayout";

export default function Home() {
  const navigate = useNavigate();
  const [bankrolls, setBankrolls] = useState([]);

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankrollEditandoId, setBankrollEditandoId] = useState(null);

  // Dados do Formulário
  const [nomeForm, setNomeForm] = useState("");
  const [capitalForm, setCapitalForm] = useState("");
  const [isDividido, setIsDividido] = useState(false);
  const [casasForm, setCasasForm] = useState([{ nome: "", capital: "" }]);

  useEffect(() => {
    carregarBankrolls();
  }, []);

  useEffect(() => {
    if (isDividido) {
      const somaTotal = casasForm.reduce((acumulador, casa) => {
        return acumulador + (Number(casa.capital) || 0);
      }, 0);
      setCapitalForm(somaTotal);
    }
  }, [casasForm, isDividido]);

  const carregarBankrolls = async () => {
    try {
      const resposta = await fetch("http://localhost:3000/api/bankrolls");
      const dados = await resposta.json();
      setBankrolls(dados);
    } catch (erro) {
      console.error("Erro ao buscar:", erro);
    }
  };

  const adicionarLinhaCasa = () => setCasasForm([...casasForm, { nome: "", capital: "" }]);
  const removerLinhaCasa = (index) => setCasasForm(casasForm.filter((_, i) => i !== index));
  const atualizarLinhaCasa = (index, campo, valor) => {
    const novaLista = [...casasForm];
    novaLista[index][campo] = valor;
    setCasasForm(novaLista);
  };

  const fecharModalELimpar = () => {
    setIsModalOpen(false);
    setBankrollEditandoId(null);
    setNomeForm("");
    setCapitalForm("");
    setIsDividido(false);
    setCasasForm([{ nome: "", capital: "" }]);
  };

  const abrirModalParaCriar = () => {
    fecharModalELimpar();
    setIsModalOpen(true);
  };

  const abrirModalParaEditar = async (br, e) => {
    e.stopPropagation();
    setBankrollEditandoId(br.id);
    setNomeForm(br.nome);
    setCapitalForm(br.capital_inicial);

    try {
      const res = await fetch(`http://localhost:3000/api/bankrolls/${br.id}`);
      const dados = await res.json();
      if (dados.casas && dados.casas.length > 0) {
        setIsDividido(true);
        setCasasForm(
          dados.casas.map((c) => ({
            nome: c.nome_casa,
            capital: c.saldo_atual,
          }))
        );
      } else {
        setIsDividido(false);
        setCasasForm([{ nome: "", capital: "" }]);
      }
    } catch (erro) {
      console.error("Erro ao carregar detalhes para edição:", erro);
    }
    setIsModalOpen(true);
  };

  const deletarBankroll = async (id) => {
    if (!window.confirm("Tem certeza? Esta ação apagará todo o capital e histórico de apostas vinculadas a este bankroll.")) return;
    try {
      await fetch(`http://localhost:3000/api/bankrolls/${id}`, { method: "DELETE" });
      fecharModalELimpar();
      carregarBankrolls();
    } catch (erro) { console.error("Erro ao deletar:", erro); }
  };

  const salvarBankroll = async (e) => {
    e.preventDefault();
    const payload = {
      nome: nomeForm,
      capital_inicial: Number(capitalForm),
      moeda: "BRL",
      casas_apostas: isDividido ? casasForm : [],
    };

    try {
      if (bankrollEditandoId) {
        await fetch(`http://localhost:3000/api/bankrolls/${bankrollEditandoId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        await fetch("http://localhost:3000/api/bankrolls", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      fecharModalELimpar();
      carregarBankrolls();
    } catch (erro) { console.error("Erro ao salvar:", erro); }
  };

  return (
    <DashboardLayout>
      <Header>
        <PageTitle>Bankrolls</PageTitle>
        <HeaderActions>
          <ButtonSecondary>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            Organizar
          </ButtonSecondary>
          <ButtonPrimary onClick={abrirModalParaCriar}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
            Adicionar bankroll
          </ButtonPrimary>
        </HeaderActions>
      </Header>

      <Grid>
        {bankrolls.map((br) => {
          const roi = br.capital_inicial > 0 ? (br.lucro_total / br.capital_inicial) * 100 : 0;
          const progressao = roi;

          return (
            <Card key={br.id} onClick={() => navigate(`/bankroll/${br.id}`)}>
              <CardHeader>
                <CardTitle>{br.nome}</CardTitle>
                <IconButton onClick={(e) => abrirModalParaEditar(br, e)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </IconButton>
              </CardHeader>

              <MetricsRow>
                <MetricBox>
                  <MetricLabel>ROI</MetricLabel>
                  <MetricValue $isPositive={roi > 0} $isNegative={roi < 0}>
                    {roi > 0 ? "+" : ""}{roi.toFixed(2)}%
                  </MetricValue>
                </MetricBox>
                <MetricBox>
                  <MetricLabel>PROGRESSÃO</MetricLabel>
                  <MetricValue $isPositive={progressao > 0} $isNegative={progressao < 0}>
                    {progressao > 0 ? "+" : ""}{progressao.toFixed(2)}%
                  </MetricValue>
                </MetricBox>
              </MetricsRow>
            </Card>
          );
        })}

        <AddCard onClick={abrirModalParaCriar}>
          <AddIcon>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
          </AddIcon>
          <span>Adicionar bankroll</span>
        </AddCard>
      </Grid>

      {isModalOpen && (
        <ModalOverlay onClick={fecharModalELimpar}>
          <DarkModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{bankrollEditandoId ? "Editar bankroll" : "Adicionar bankroll"}</ModalTitle>
              <CloseBtn onClick={fecharModalELimpar}>×</CloseBtn>
            </ModalHeader>

            <form onSubmit={salvarBankroll}>
              <FormGroup>
                <Label>Nome da bankroll</Label>
                <Input type="text" required value={nomeForm} onChange={(e) => setNomeForm(e.target.value)} />
              </FormGroup>

              <FormGroup>
                <Label>Capital inicial</Label>
                <Input 
                  type="number" step="0.01" required value={capitalForm} disabled={isDividido}
                  onChange={(e) => setCapitalForm(e.target.value)} 
                  placeholder={isDividido ? "Calculado automaticamente..." : "0"} 
                />
              </FormGroup>

              <ToggleContainer>
                <ToggleLabel>Dividir o capital em várias casas de apostas</ToggleLabel>
                <CustomCheckbox type="checkbox" checked={isDividido} onChange={(e) => setIsDividido(e.target.checked)} />
              </ToggleContainer>

              {isDividido && (
                <CasasContainer>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                    <Label style={{ width: "35%", marginBottom: 0 }}>Casa de apostas</Label>
                    <Label style={{ flex: 1, marginBottom: 0 }}>Capital</Label>
                    <div style={{ width: "30px" }}></div>
                  </div>

                  {casasForm.map((casa, index) => (
                    <CasaRow key={index}>
                      <Select required value={casa.nome} onChange={(e) => atualizarLinhaCasa(index, 'nome', e.target.value)}>
                        <option value=""></option>
                        <option value="bet365">bet365</option>
                        <option value="NOVI BET">NOVI BET</option>
                        <option value="SPORTING BET">SPORTING BET</option>
                        <option value="BETANO">BETANO</option>
                        <option value="SUPERBET">SUPERBET</option>
                        <option value="BETMGM">BETMGM</option>
                      </Select>
                      <Input type="number" placeholder="0" required value={casa.capital} onChange={(e) => atualizarLinhaCasa(index, "capital", e.target.value)} />
                      {casasForm.length > 1 && (
                        <BtnRemove type="button" onClick={() => removerLinhaCasa(index)}>×</BtnRemove>
                      )}
                    </CasaRow>
                  ))}
                  <BtnAddCasa type="button" onClick={adicionarLinhaCasa}>Adicionar casa de apostas</BtnAddCasa>
                </CasasContainer>
              )}

              <ModalActions>
                {bankrollEditandoId && (
                  <BtnDanger type="button" onClick={() => deletarBankroll(bankrollEditandoId)}>Excluir Bankroll</BtnDanger>
                )}
                <div style={{ display: "flex", gap: "12px", width: '100%', justifyContent: bankrollEditandoId ? "flex-end" : "space-between" }}>
                  <ModalBtnSecondary type="button" onClick={fecharModalELimpar}>Cancelar</ModalBtnSecondary>
                  <ButtonPrimary type="submit" style={{ flex: 1, justifyContent: "center" }}>
                    {bankrollEditandoId ? "Salvar Alterações" : "Criar Bankroll"}
                  </ButtonPrimary>
                </div>
              </ModalActions>
            </form>
          </DarkModalBox>
        </ModalOverlay>
      )}
    </DashboardLayout>
  );
}

// --- STYLED COMPONENTS ---

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 20px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  color: #f3f4f6;
  font-weight: 700;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ButtonPrimary = styled.button`
  background-color: #6b68ff; /* Roxo idêntico ao da imagem */
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5c59f0;
  }
`;

const ButtonSecondary = styled.button`
  background-color: transparent;
  color: #d1d5db;
  border: 1px solid #2a2e38;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    background-color: #1b1e27;
    color: #fff;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background-color: #1b1e27;
  border: 1px solid #2a2e38;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    border-color: #4b5563;
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #2a2e38;
`;

const CardTitle = styled.h3`
  font-size: 13px;
  color: #f3f4f6;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #d1d5db;
  }
`;

const MetricsRow = styled.div`
  display: flex;
  padding: 20px;
  gap: 15px;
`;

const MetricBox = styled.div`
  flex: 1;
  background-color: #0e1117;
  border: 1px solid #2a2e38;
  padding: 18px 10px;
  border-radius: 6px;
  text-align: center;
`;

const MetricLabel = styled.span`
  display: block;
  font-size: 10px;
  color: #8b949e;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${({ $isPositive, $isNegative }) => ($isPositive ? '#10b981' : $isNegative ? '#f43f5e' : '#f3f4f6')};
`;

const AddCard = styled.div`
  border: 1px dashed #2a2e38;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #8b949e;
  cursor: pointer;
  border-radius: 8px;
  min-height: 160px;
  transition: all 0.2s;

  &:hover {
    border-color: #6b68ff;
    color: #6b68ff;
    background-color: rgba(107, 104, 255, 0.05);
  }

  span {
    margin-top: 12px;
    font-weight: 500;
    font-size: 14px;
  }
`;

const AddIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// --- MODAL STYLES (EXATAMENTE COMO A REFERÊNCIA) ---

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
`;

const DarkModalBox = styled.div`
  background-color: #1b1e27; /* Fundo cinza profundo/azulado do modal */
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 460px;
  border: 1px solid #2a2e38;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
`;

const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;
`;

const ModalTitle = styled.h2`
  font-size: 20px; 
  color: #ffffff;
  font-weight: 700;
`;

const CloseBtn = styled.button`
  background: none; border: none; font-size: 22px; cursor: pointer; color: #8b949e;
  &:hover { color: #ffffff; }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block; font-size: 12px; color: #8b949e; margin-bottom: 8px; font-weight: 600;
`;

const Input = styled.input`
  width: 100%; 
  padding: 12px; 
  background-color: #0e1117; /* Fundo bem escuro do input */
  border: 1px solid #2a2e38;
  color: #f3f4f6; 
  border-radius: 6px; 
  font-size: 14px;
  transition: border-color 0.2s;
  
  &:focus { outline: none; border-color: #6b68ff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Select = styled.select`
  width: 35%; /* Ocupa um espaço menor como na imagem */
  padding: 12px; 
  background-color: #0e1117; 
  border: 1px solid #2a2e38;
  color: #f3f4f6; 
  border-radius: 6px; 
  font-size: 14px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;

  &:focus { outline: none; border-color: #6b68ff; }
  option { background-color: #1b1e27; color: #f3f4f6; }
`;

const ToggleContainer = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 20px; 
  background-color: #0e1117; /* Fundo idêntico aos inputs */
  border: 1px solid #2a2e38;
  border-radius: 6px; margin-bottom: 25px; 
`;

const ToggleLabel = styled.span`
  font-size: 14px; font-weight: 600; color: #d1d5db;
`;

const CustomCheckbox = styled.input`
  appearance: none;
  width: 18px;
  height: 18px;
  background-color: #0e1117;
  border: 1px solid #374151;
  border-radius: 4px;
  display: grid;
  place-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &::before {
    content: "";
    width: 10px;
    height: 10px;
    transform: scale(0);
    transition: 120ms transform ease-in-out;
    box-shadow: inset 1em 1em white;
    background-color: white;
    transform-origin: center;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  &:checked {
    background-color: #6b68ff;
    border-color: #6b68ff;
  }

  &:checked::before {
    transform: scale(1);
  }
`;

const CasasContainer = styled.div`
  margin-top: 10px;
  margin-bottom: 25px;
`;

const CasaRow = styled.div`
  display: flex; 
  gap: 12px; 
  margin-bottom: 12px;
`;

const BtnRemove = styled.button`
  background-color: transparent; 
  color: #8b949e; 
  border: none;
  width: 30px;
  cursor: pointer; 
  font-size: 20px;
  &:hover { color: #f43f5e; }
`;

const BtnAddCasa = styled.button`
  width: 100%; 
  padding: 14px; 
  background-color: #0e1117; 
  border: 1px dashed #2a2e38;
  color: #8b949e; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: 600; 
  font-size: 13px;
  transition: all 0.2s;

  &:hover { 
    border-color: #6b68ff; 
    color: #6b68ff; 
  }
`;

const ModalActions = styled.div`
  display: flex; 
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;

const ModalBtnSecondary = styled.button`
  background-color: transparent; 
  color: #d1d5db; 
  border: 1px solid #2a2e38;
  padding: 12px 20px; 
  border-radius: 6px; 
  font-weight: 600; 
  font-size: 14px;
  cursor: pointer;
  flex: 0 0 auto; /* Mantém o tamanho do conteúdo */
  transition: all 0.2s;

  &:hover { 
    background-color: #2a2e38; 
    color: #fff; 
  }
`;

const BtnDanger = styled.button`
  background: none; 
  color: #f43f5e; 
  border: none; 
  font-weight: 600; 
  font-size: 13px; 
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;