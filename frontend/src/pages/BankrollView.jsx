import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import styled from "styled-components";
import DashboardLayout from "../components/DashboardLayout";
import StatsDrawer from "../components/StatsDrawer";
import ProfitCalendar from "../components/ProfitCalendar";

export default function BankrollView() {
  const { id } = useParams();
  const [bankroll, setBankroll] = useState(null);
  const [apostas, setApostas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  // Modais de Aposta e Telas
  const [isModalApostaOpen, setIsModalApostaOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modais de Transação
  const [isTransacaoModalOpen, setIsTransacaoModalOpen] = useState(false);
  const [transacaoEditing, setTransacaoEditing] = useState(null);
  const [dataTransacao, setDataTransacao] = useState("");
  const [horaTransacao, setHoraTransacao] = useState("");
  const [tipoTransacao, setTipoTransacao] = useState("deposito");
  const [valorTransacao, setValorTransacao] = useState("");

  // Formulário de Aposta
  const [apostaEditandoId, setApostaEditandoId] = useState(null);
  const [apostaStatusEditing, setApostaStatusEditing] = useState(null);
  const [apostaViewing, setApostaViewing] = useState(null);
  const [dataAposta, setDataAposta] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [horaAposta, setHoraAposta] = useState("16:00");
  const [casaSelecionada, setCasaSelecionada] = useState("");
  const [formato, setFormato] = useState("Simples");
  const [valorInvestido, setValorInvestido] = useState("");
  const [lucroObtido, setLucroObtido] = useState(0);
  const [selecoes, setSelecoes] = useState([
    { titulo: "", cotacao: "", esporte: "Futebol", status: "Pendente" },
  ]);

  const filtrosIniciais = {
    dataInicio: "",
    dataFim: "",
    titulo: "",
    estado: "",
    tipoItem: "",
    esporte: "",
    casa: "",
    valorMin: "",
    valorMax: "",
    cotacaoMin: "",
    cotacaoMax: "",
    aoVivo: "Todos",
    gratuita: "Todos",
  };
  const [filtros, setFiltros] = useState(filtrosIniciais);

  useEffect(() => {
    carregarDetalhesBankroll();
    carregarApostas();
    carregarHistorico();
  }, [id]);

  useEffect(() => {
    if (!valorInvestido) return;
    const temPerdida = selecoes.some((s) => s.status === "Perdida");
    const todasGanhas =
      selecoes.length > 0 && selecoes.every((s) => s.status === "Ganha");

    if (temPerdida) {
      setLucroObtido((-Number(valorInvestido)).toFixed(2));
    } else if (todasGanhas) {
      const odd =
        formato === "Múltipla" ? calcularOddMultipla() : selecoes[0].cotacao;
      const lucroBruto = Number(valorInvestido) * Number(odd);
      setLucroObtido((lucroBruto - Number(valorInvestido)).toFixed(2));
    } else {
      setLucroObtido(0);
    }
  }, [selecoes, valorInvestido, formato]);

  const carregarDetalhesBankroll = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/bankrolls/${id}`);
      setBankroll(await res.json());
    } catch (erro) {
      console.error("Erro detalhes:", erro);
    }
  };

  const carregarApostas = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/apostas/bankroll/${id}`,
      );
      setApostas(await res.json());
    } catch (erro) {
      console.error("Erro apostas:", erro);
    }
  };

  const carregarHistorico = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/bankrolls/${id}/transacoes`,
      );
      setTransacoes(await res.json());
    } catch (error) {
      console.error("Erro transacoes:", error);
    }
  };

  // --- IMPORTAÇÃO E EXPORTAÇÃO ---
  const exportarCSV = () => {
    const header = [
      "Date",
      "Type",
      "Sport",
      "Label",
      "Odds",
      "Stake",
      "State",
      "Bookmaker",
      "Tipster",
      "Category",
      "Competition",
      "BetType",
      "Closing",
      "EstimatedProbability",
      "Commission",
      "Bonus",
      "Live",
      "Freebet",
      "Cashout",
      "Eachway",
      "Comment",
    ];

    const rows = apostas.map((aposta) => {
      const casaObj = bankroll.casas?.find(
        (c) => c.id === aposta.casa_aposta_id,
      );
      const bookmaker = casaObj ? casaObj.nome_casa : "";
      const dateObj = new Date(aposta.data_hora);
      let dateCsv = "";
      if (!isNaN(dateObj.getTime())) {
        dateCsv = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")} ${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
      }

      let type = aposta.formato_aposta === "Múltipla" ? "Combined" : "Simple";
      let label = aposta.selecoes.map((s) => s.titulo).join(" + ");
      let sport = aposta.selecoes[0]?.esporte || "Futebol";

      let odds =
        aposta.formato_aposta === "Múltipla"
          ? aposta.selecoes
              .reduce((acc, sel) => acc * (Number(sel.cotacao) || 1), 1)
              .toFixed(3)
          : aposta.selecoes[0]?.cotacao || 1;

      let stake = aposta.valor_investido;
      let state = "P";
      if (aposta.status_geral === "Ganha") state = "W";
      else if (aposta.status_geral === "Perdida") state = "L";
      else if (aposta.status_geral === "Reembolsada") state = "R";
      else if (aposta.status_geral === "Cashout") state = "CASH";
      else if (aposta.status_geral === "Meio ganho") state = "HW";
      else if (aposta.status_geral === "Meio perdido") state = "HL";
      else if (aposta.status_geral === "Cancelado") state = "V";

      return [
        dateCsv,
        type,
        sport,
        `"${label}"`,
        odds,
        stake,
        state,
        bookmaker,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ].join(";");
    });

    const csvContent = [header.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_${bankroll.nome}_Bet-Analytix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importarCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split("\n").filter((r) => r.trim());

      const parseCSVRow = (str) => {
        let result = [];
        let cur = "";
        let inQuotes = false;
        const separator = str.includes(";") ? ";" : ",";
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '"') inQuotes = !inQuotes;
          else if (str[i] === separator && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else cur += str[i];
        }
        result.push(cur.trim());
        return result.map((c) => c.replace(/^"|"$/g, ""));
      };

      const apostasParaImportar = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVRow(rows[i]);
        if (cols.length < 8) continue;

        const [dateStr, type, sport, labelRaw, odds, stake, state, bookmaker] =
          cols;
        const label = labelRaw ? labelRaw : "Aposta Importada";

        let status = "Pendente";
        if (state === "W") status = "Ganha";
        else if (state === "L") status = "Perdida";
        else if (state === "R") status = "Reembolsada";
        else if (state === "CASH") status = "Cashout";
        else if (state === "HW") status = "Meio ganho";
        else if (state === "HL") status = "Meio perdido";
        else if (state === "V") status = "Cancelado";

        let formato = type === "Combined" ? "Múltipla" : "Simples";
        let dataHoraIso = new Date().toISOString();

        if (dateStr) {
          const parts = dateStr.trim().split(" ");
          if (parts.length >= 2) {
            let dPart = parts[0];
            let tPart = parts[1];
            if (dPart.includes("/")) {
              const dArr = dPart.split("/");
              if (dArr.length === 3) {
                if (dArr[2].length === 4)
                  dPart = `${dArr[2]}-${dArr[1]}-${dArr[0]}`;
                else dPart = `${dArr[0]}-${dArr[1]}-${dArr[2]}`;
              }
            }
            if (tPart.length === 5) tPart += ":00";
            dataHoraIso = `${dPart}T${tPart}`;
          }
        }

        let valorNum = Number(stake.replace(",", ".")) || 0;
        let oddNum = Number(odds.replace(",", ".")) || 1;
        let lucroCalculado = 0;

        if (status === "Ganha") lucroCalculado = valorNum * oddNum - valorNum;
        else if (status === "Perdida") lucroCalculado = -valorNum;
        else if (status === "Meio ganho")
          lucroCalculado = (valorNum / 2) * (oddNum - 1);
        else if (status === "Meio perdido") lucroCalculado = -(valorNum / 2);

        apostasParaImportar.push({
          data_hora: dataHoraIso,
          formato_aposta: formato,
          valor_investido: valorNum,
          lucro_obtido: lucroCalculado,
          status_geral: status,
          casa_aposta_nome: bookmaker,
          selecoes: [
            {
              titulo: label,
              esporte: sport || "Futebol",
              cotacao: oddNum,
              status: status,
            },
          ],
        });
      }

      if (apostasParaImportar.length === 0) {
        alert("Nenhuma aposta válida encontrada.");
        return;
      }
      try {
        const res = await fetch(
          `http://localhost:3000/api/bankrolls/${id}/importar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apostas: apostasParaImportar }),
          },
        );
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Erro do servidor (Código: ${res.status})`,
          );
        }
        carregarApostas();
        carregarDetalhesBankroll();
        alert(
          `Importação de ${apostasParaImportar.length} apostas concluída com sucesso!`,
        );
      } catch (err) {
        console.error("Erro ao importar", err);
        alert(`Falha na importação: ${err.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  // --- LÓGICA DE TRANSAÇÕES E APOSTAS ---
  const abrirEditarTransacao = (tr) => {
    setTransacaoEditing(tr);
    const [d, h] = tr.data_hora.split("T");
    setDataTransacao(d);
    setHoraTransacao(h.substring(0, 5));
    setValorTransacao(tr.valor);
    setTipoTransacao(tr.tipo);
    setIsTransacaoModalOpen(true);
  };

  const deletarTransacao = async (idTr) => {
    if (
      !window.confirm(
        "Tem certeza? O saldo da casa de aposta será revertido automaticamente.",
      )
    )
      return;
    try {
      await fetch(`http://localhost:3000/api/transacoes/${idTr}`, {
        method: "DELETE",
      });
      setIsTransacaoModalOpen(false);
      carregarHistorico();
      carregarDetalhesBankroll();
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
    }
  };

  const salvarEdicaoTransacao = async (e) => {
    e.preventDefault();
    try {
      const dataHoraIso = `${dataTransacao}T${horaTransacao}:00`;
      await fetch(
        `http://localhost:3000/api/transacoes/${transacaoEditing.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: tipoTransacao,
            valor: Number(valorTransacao),
            data_hora: dataHoraIso,
          }),
        },
      );
      setIsTransacaoModalOpen(false);
      carregarHistorico();
      carregarDetalhesBankroll();
    } catch (error) {
      console.error("Erro ao editar transação:", error);
    }
  };

  const atualizarSelecao = (index, campo, valor) => {
    const novaLista = [...selecoes];
    novaLista[index][campo] = valor;
    setSelecoes(novaLista);
  };

  const adicionarSelecao = () => {
    setSelecoes([
      ...selecoes,
      { titulo: "", cotacao: "", esporte: "Futebol", status: "Pendente" },
    ]);
    setFormato("Múltipla");
  };

  const removerSelecao = (index) => {
    const novaLista = selecoes.filter((_, i) => i !== index);
    setSelecoes(novaLista);
    if (novaLista.length === 1 && formato === "Múltipla") setFormato("Simples");
  };

  const calcularOddMultipla = () => {
    const oddTotal = selecoes.reduce(
      (acc, sel) => acc * (Number(sel.cotacao) || 1),
      1,
    );
    return selecoes.some((sel) => Number(sel.cotacao) > 0)
      ? oddTotal.toFixed(2)
      : "0.00";
  };

  const deletarAposta = async (apostaId) => {
    if (!window.confirm("Tem certeza que deseja remover esta aposta?")) return;
    try {
      await fetch(`http://localhost:3000/api/apostas/${apostaId}`, {
        method: "DELETE",
      });
      setIsViewModalOpen(false);
      carregarApostas();
      carregarDetalhesBankroll();
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const abrirModalParaCriar = () => {
    setApostaEditandoId(null);
    setDataAposta(new Date().toISOString().split("T")[0]);
    setHoraAposta("16:00");
    setCasaSelecionada("");
    setFormato("Simples");
    setValorInvestido("");
    setLucroObtido(0);
    setSelecoes([
      { titulo: "", cotacao: "", esporte: "Futebol", status: "Pendente" },
    ]);
    setIsModalApostaOpen(true);
  };

  const abrirModalVisualizacao = (aposta) => {
    setApostaViewing(aposta);
    setIsViewModalOpen(true);
  };

  const abrirModalParaEditar = (aposta) => {
    setIsViewModalOpen(false);
    setIsStatusModalOpen(false);
    setApostaEditandoId(aposta.id);
    const dataSplit = aposta.data_hora.split("T");
    setDataAposta(dataSplit[0]);
    setHoraAposta(dataSplit[1] ? dataSplit[1].substring(0, 5) : "16:00");
    setCasaSelecionada(aposta.casa_aposta_id || "");
    setFormato(aposta.formato_aposta);
    setValorInvestido(aposta.valor_investido);
    setLucroObtido(aposta.lucro_obtido);

    if (aposta.selecoes && aposta.selecoes.length > 0) {
      setSelecoes(
        aposta.selecoes.map((s) => ({
          titulo: s.titulo,
          cotacao: s.cotacao,
          esporte: s.esporte,
          status: s.status_selecao || "Pendente",
        })),
      );
    } else {
      setSelecoes([
        { titulo: "", cotacao: "", esporte: "Futebol", status: "Pendente" },
      ]);
    }
    setIsModalApostaOpen(true);
  };

  const salvarAposta = async (e) => {
    e.preventDefault();
    try {
      const dataHoraIso = `${dataAposta}T${horaAposta}:00`;

      if (!apostaEditandoId && formato === "Simples" && selecoes.length > 1) {
        for (const sel of selecoes) {
          let calcLucro = 0;
          if (sel.status === "Ganha")
            calcLucro =
              Number(valorInvestido) * Number(sel.cotacao) -
              Number(valorInvestido);
          else if (sel.status === "Perdida")
            calcLucro = -Number(valorInvestido);
          await fetch("http://localhost:3000/api/apostas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bankroll_id: id,
              casa_aposta_id: casaSelecionada || null,
              data_hora: dataHoraIso,
              formato_aposta: formato,
              valor_investido: Number(valorInvestido),
              lucro_obtido: calcLucro,
              status_geral: sel.status,
              selecoes: [sel],
            }),
          });
        }
      } else {
        const temPerdida = selecoes.some((s) => s.status === "Perdida");
        const todasGanhas = selecoes.every((s) => s.status === "Ganha");
        const todasResolvidas = selecoes.every((s) => s.status !== "Pendente");
        let statusGeral = temPerdida
          ? "Perdida"
          : todasGanhas
            ? "Ganha"
            : todasResolvidas
              ? "Reembolsada"
              : "Pendente";
        const payload = {
          bankroll_id: id,
          casa_aposta_id: casaSelecionada || null,
          data_hora: dataHoraIso,
          formato_aposta: formato,
          valor_investido: Number(valorInvestido),
          lucro_obtido: Number(lucroObtido),
          status_geral: statusGeral,
          selecoes: selecoes,
        };
        if (apostaEditandoId) {
          await fetch(`http://localhost:3000/api/apostas/${apostaEditandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch("http://localhost:3000/api/apostas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }
      setIsModalApostaOpen(false);
      carregarApostas();
      carregarDetalhesBankroll();
    } catch (erro) {
      console.error("Erro ao salvar aposta:", erro);
    }
  };

  const abrirStatusRapido = (aposta) => {
    setApostaStatusEditing(aposta);
    setIsStatusModalOpen(true);
  };

  const salvarStatusRapido = async (novoStatus) => {
    if (!apostaStatusEditing) return;
    const aposta = apostaStatusEditing;
    const valor = Number(aposta.valor_investido);
    const oddMultipla = aposta.selecoes.reduce(
      (acc, sel) => acc * (Number(sel.cotacao) || 1),
      1,
    );
    const cotacao =
      aposta.formato_aposta === "Múltipla"
        ? oddMultipla
        : aposta.selecoes.length > 0
          ? Number(aposta.selecoes[0].cotacao)
          : 1;

    let novoLucro = 0;
    if (novoStatus === "Ganha") novoLucro = valor * cotacao - valor;
    else if (novoStatus === "Perdida") novoLucro = -valor;
    else if (novoStatus === "Meio ganho")
      novoLucro = (valor / 2) * (cotacao - 1);
    else if (novoStatus === "Meio perdido") novoLucro = -(valor / 2);
    try {
      await fetch(`http://localhost:3000/api/apostas/${aposta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aposta,
          status_geral: novoStatus,
          lucro_obtido: novoLucro,
          selecoes: aposta.selecoes.map((s) => ({ ...s, status: novoStatus })),
        }),
      });
      setIsStatusModalOpen(false);
      setApostaStatusEditing(null);
      carregarApostas();
      carregarDetalhesBankroll();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  // --- LÓGICA DE UNIFICAÇÃO E FILTROS ---
  const handleFiltroChange = (campo, valor) =>
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  const limparFiltros = () => setFiltros(filtrosIniciais);
  const aplicarFiltros = () => {
    let listaUnificada = [
      ...apostas.map((a) => ({ ...a, typeObj: "aposta" })),
      ...transacoes.map((t) => ({ ...t, typeObj: "transacao" })),
    ].sort((a, b) => {
      const db = new Date(b.data_hora).getTime();
      const da = new Date(a.data_hora).getTime();
      return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
    });
    return listaUnificada.filter((item) => {
      if (
        filtros.dataInicio &&
        new Date(item.data_hora) < new Date(filtros.dataInicio)
      )
        return false;
      if (
        filtros.dataFim &&
        new Date(item.data_hora) > new Date(filtros.dataFim + "T23:59:59")
      )
        return false;
      if (filtros.tipoItem) {
        if (
          filtros.tipoItem === "Depósito/Retirada" &&
          item.typeObj !== "transacao"
        )
          return false;
        if (
          filtros.tipoItem !== "Depósito/Retirada" &&
          item.typeObj !== "aposta"
        )
          return false;
      }
      if (filtros.casa && item.casa_aposta_id !== Number(filtros.casa))
        return false;
      if (item.typeObj === "aposta") {
        if (filtros.estado && item.status_geral !== filtros.estado)
          return false;
        if (filtros.valorMin && item.valor_investido < Number(filtros.valorMin))
          return false;
        if (filtros.valorMax && item.valor_investido > Number(filtros.valorMax))
          return false;
        if (
          filtros.titulo ||
          filtros.esporte ||
          filtros.cotacaoMin ||
          filtros.cotacaoMax
        ) {
          const atendeSelecoes = item.selecoes.some((sel) => {
            let ok = true;
            if (
              filtros.titulo &&
              !sel.titulo.toLowerCase().includes(filtros.titulo.toLowerCase())
            )
              ok = false;
            if (filtros.esporte && sel.esporte !== filtros.esporte) ok = false;
            if (filtros.cotacaoMin && sel.cotacao < Number(filtros.cotacaoMin))
              ok = false;
            if (filtros.cotacaoMax && sel.cotacao > Number(filtros.cotacaoMax))
              ok = false;
            return ok;
          });
          if (!atendeSelecoes) return false;
        }
      }
      return true;
    });
  };
  const listaFiltrada = aplicarFiltros();

  const agruparLista = () => {
    return listaFiltrada.reduce((acc, item) => {
      let date = new Date(item.data_hora);
      if (isNaN(date.getTime())) date = new Date();
      const mes = date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
      const diaSemana = date.toLocaleDateString("pt-BR", { weekday: "long" });
      const diaSemanaCap =
        diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1).split("-")[0];
      const diaNumero = String(date.getDate()).padStart(2, "0");
      const cabecalhoDia =
        `${diaSemanaCap}-${diaSemana.includes("feira") ? "Feira" : ""} ${diaNumero}`.replace(
          "- ",
          " ",
        );

      if (!acc[mesCapitalizado]) acc[mesCapitalizado] = {};
      if (!acc[mesCapitalizado][cabecalhoDia])
        acc[mesCapitalizado][cabecalhoDia] = [];
      acc[mesCapitalizado][cabecalhoDia].push(item);
      return acc;
    }, {});
  };

  const listaAgrupada = agruparLista();
  const apostasFiltradas = listaFiltrada.filter((i) => i.typeObj === "aposta");
  const totalApostas = apostasFiltradas.length;
  const lucroTotal = apostasFiltradas.reduce(
    (acc, aposta) => acc + Number(aposta.lucro_obtido),
    0,
  );
  let roi =
    bankroll && bankroll.capital_inicial > 0
      ? (lucroTotal / bankroll.capital_inicial) * 100
      : 0;

  let saldoAcumulado = 0;
  const dadosGrafico = [...apostasFiltradas].reverse().map((aposta, index) => {
    saldoAcumulado += Number(aposta.lucro_obtido || 0);
    return { nome: `Aposta ${index + 1}`, saldo: saldoAcumulado };
  });
  dadosGrafico.unshift({ nome: "Início", saldo: 0 });

  if (!bankroll)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Carregando sistema...
      </div>
    );

  return (
    <DashboardLayout currentBankrollName={bankroll.nome}>
      <Header>
        <PageTitle>Estatísticas de {bankroll.nome}</PageTitle>
        <ActionGroup>
          <ButtonSecondary onClick={() => setIsCalendarOpen(true)}>
            🗓 Calendário
          </ButtonSecondary>
          <ButtonSecondary onClick={() => setIsStatsOpen(true)}>
            📊 Estatísticas
          </ButtonSecondary>
          <ButtonSecondary onClick={() => setIsFilterModalOpen(true)}>
            🔍 Filtros
          </ButtonSecondary>
          <input
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            id="import-csv"
            onChange={importarCSV}
          />
          <ButtonSecondary
            onClick={() => document.getElementById("import-csv").click()}
          >
            📥 Importar
          </ButtonSecondary>
          <ButtonSecondary onClick={exportarCSV}>📤 Exportar</ButtonSecondary>
          <ButtonPrimary onClick={abrirModalParaCriar}>
            + Adicionar aposta
          </ButtonPrimary>
        </ActionGroup>
      </Header>

      <ChartContainer>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={dadosGrafico}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />
            <XAxis dataKey="nome" hide />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [`R$ ${value.toFixed(2)}`, "Saldo"]}
            />
            <ReferenceLine y={0} stroke="#e5e7eb" />
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSaldo)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <KpiGrid>
        <KpiCard>
          <KpiLabel>APOSTAS (Filtro)</KpiLabel>
          <KpiValue>{totalApostas}</KpiValue>
        </KpiCard>
        <KpiCard>
          <KpiLabel>LUCROS (Filtro)</KpiLabel>
          <KpiValue
            $color={
              lucroTotal > 0
                ? "#10b981"
                : lucroTotal < 0
                  ? "#f43f5e"
                  : "#111827"
            }
          >
            {lucroTotal > 0 ? "+" : ""}
            {lucroTotal.toFixed(2)} R$
          </KpiValue>
        </KpiCard>
        <KpiCard>
          <KpiLabel>ROI (Filtro)</KpiLabel>
          <KpiValue
            $color={roi > 0 ? "#10b981" : roi < 0 ? "#f43f5e" : "#111827"}
          >
            {roi > 0 ? "+" : ""}
            {roi.toFixed(2)}%
          </KpiValue>
        </KpiCard>
        <KpiCard>
          <KpiLabel>PROGRESSÃO</KpiLabel>
          <KpiValue
            $color={roi > 0 ? "#10b981" : roi < 0 ? "#f43f5e" : "#111827"}
          >
            {roi > 0 ? "+" : ""}
            {roi.toFixed(2)}%
          </KpiValue>
        </KpiCard>
      </KpiGrid>

      <div style={{ marginTop: "20px" }}>
        {listaFiltrada.length === 0 ? (
          <div
            style={{ padding: "30px", textAlign: "center", color: "#6b7280" }}
          >
            Nenhum registro encontrado.
          </div>
        ) : (
          Object.entries(listaAgrupada).map(([mesAno, dias]) => {
            const lucroMes = Object.values(dias)
              .flat()
              .filter((i) => i.typeObj === "aposta")
              .reduce((acc, a) => acc + Number(a.lucro_obtido), 0);
            return (
              <MonthContainer key={mesAno}>
                <MonthHeader>
                  <span>{mesAno}</span>
                  <span
                    style={{ color: lucroMes >= 0 ? "#34d399" : "#fb7185" }}
                  >
                    {lucroMes > 0 ? "+" : ""}
                    {lucroMes.toFixed(2)} R$
                  </span>
                </MonthHeader>
                {Object.entries(dias).map(([dia, itensDia]) => {
                  const lucroDia = itensDia
                    .filter((i) => i.typeObj === "aposta")
                    .reduce((acc, a) => acc + Number(a.lucro_obtido), 0);
                  return (
                    <DayContainer key={dia}>
                      <DayHeader>
                        <span>{dia}</span>
                        <span
                          style={{
                            color: lucroDia >= 0 ? "#34d399" : "#fb7185",
                          }}
                        >
                          {lucroDia > 0 ? "+" : ""}
                          {lucroDia.toFixed(2)} R$
                        </span>
                      </DayHeader>
                      {itensDia.map((item) => {
                        let dateTemp = new Date(item.data_hora);
                        if (isNaN(dateTemp.getTime())) dateTemp = new Date();
                        const horaFormatada = dateTemp.toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit" },
                        );
                        const casaObj = bankroll.casas?.find(
                          (c) => c.id === item.casa_aposta_id,
                        );
                        const nomeCasa = casaObj ? casaObj.nome_casa : "";

                        if (item.typeObj === "transacao") {
                          const isDeposito = item.tipo === "deposito";
                          return (
                            <TransactionRow key={`trans-${item.id}`}>
                              <RowLeft>
                                <DotsBtn
                                  onClick={() => abrirEditarTransacao(item)}
                                >
                                  ⋮
                                </DotsBtn>
                                <div>
                                  <TimeBadge>{horaFormatada}</TimeBadge>
                                  <RowTitle>
                                    {isDeposito
                                      ? "Depósito Realizado"
                                      : "Saque Realizado"}{" "}
                                    {nomeCasa && ` - ${nomeCasa}`}
                                  </RowTitle>
                                </div>
                              </RowLeft>
                              <TransactionValue $isPositive={isDeposito}>
                                {isDeposito ? "+" : "-"}
                                {item.valor.toFixed(2)} R$
                              </TransactionValue>
                            </TransactionRow>
                          );
                        }

                        let tituloAposta = "Aposta sem título";
                        let cotacao = "0.000";
                        if (item.formato_aposta === "Múltipla") {
                          tituloAposta = `Múltipla ${item.selecoes.length} Apostas`;
                          cotacao = item.selecoes
                            .reduce(
                              (acc, sel) => acc * (Number(sel.cotacao) || 1),
                              1,
                            )
                            .toFixed(3);
                        } else {
                          tituloAposta =
                            item.selecoes && item.selecoes.length > 0
                              ? item.selecoes[0].titulo
                              : "Aposta sem título";
                          cotacao =
                            item.selecoes && item.selecoes.length > 0
                              ? Number(item.selecoes[0].cotacao).toFixed(3)
                              : "0.000";
                        }
                        const ganho =
                          item.status_geral === "Ganha"
                            ? (item.valor_investido * cotacao).toFixed(2)
                            : "0.00";

                        return (
                          <BetRow key={`aposta-${item.id}`}>
                            <RowLeft>
                              <DotsBtn
                                onClick={() => abrirModalVisualizacao(item)}
                              >
                                ⋮
                              </DotsBtn>
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  <TimeBadge>{horaFormatada}</TimeBadge>
                                  <FormatBadge>
                                    {item.formato_aposta}
                                  </FormatBadge>
                                  {nomeCasa && (
                                    <CasaBadge>{nomeCasa}</CasaBadge>
                                  )}
                                </div>
                                <RowTitle>{tituloAposta}</RowTitle>
                              </div>
                            </RowLeft>
                            <RowRight>
                              <StatCol>
                                <StatVal>{cotacao}</StatVal>
                                <StatLbl>Cotação</StatLbl>
                              </StatCol>
                              <StatCol>
                                <StatVal>
                                  {item.valor_investido.toFixed(2)}
                                  <small>R$</small>
                                </StatVal>
                                <StatLbl>Valor</StatLbl>
                              </StatCol>
                              <StatCol>
                                <StatVal $status={item.status_geral}>
                                  {ganho}
                                  <small>R$</small>
                                </StatVal>
                                <StatLbl>Ganho</StatLbl>
                              </StatCol>
                              <StatCol>
                                <StatVal $status={item.status_geral}>
                                  {item.lucro_obtido > 0 ? "+" : ""}
                                  {item.lucro_obtido.toFixed(2)}
                                  <small>R$</small>
                                </StatVal>
                                <StatLbl>Lucro</StatLbl>
                              </StatCol>
                              <StatusVertical
                                $status={item.status_geral}
                                onClick={() => abrirStatusRapido(item)}
                              >
                                {item.status_geral}
                              </StatusVertical>
                            </RowRight>
                          </BetRow>
                        );
                      })}
                    </DayContainer>
                  );
                })}
              </MonthContainer>
            );
          })
        )}
      </div>

      {/* MODAL TRANSAÇÃO */}
      {isTransacaoModalOpen && transacaoEditing && (
        <ModalOverlay onClick={() => setIsTransacaoModalOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Editar Movimentação</ModalTitle>
              <CloseBtn onClick={() => setIsTransacaoModalOpen(false)}>
                ×
              </CloseBtn>
            </ModalHeader>
            <form onSubmit={salvarEdicaoTransacao}>
              <div
                style={{ display: "flex", gap: "15px", marginBottom: "15px" }}
              >
                <FormGroup style={{ flex: 1 }}>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    required
                    value={dataTransacao}
                    onChange={(e) => setDataTransacao(e.target.value)}
                  />
                </FormGroup>
                <FormGroup style={{ flex: 1 }}>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    required
                    value={horaTransacao}
                    onChange={(e) => setHoraTransacao(e.target.value)}
                  />
                </FormGroup>
              </div>
              <FormGroup>
                <Label>Tipo</Label>
                <Select
                  value={tipoTransacao}
                  onChange={(e) => setTipoTransacao(e.target.value)}
                >
                  <option value="deposito">Depósito</option>
                  <option value="retirada">Retirada (Saque)</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={valorTransacao}
                  onChange={(e) => setValorTransacao(e.target.value)}
                />
              </FormGroup>
              <ModalActions>
                <BtnDanger
                  type="button"
                  onClick={() => deletarTransacao(transacaoEditing.id)}
                >
                  Excluir
                </BtnDanger>
                <div style={{ display: "flex", gap: "10px" }}>
                  <ButtonSecondary
                    type="button"
                    onClick={() => setIsTransacaoModalOpen(false)}
                  >
                    Cancelar
                  </ButtonSecondary>
                  <ButtonPrimary type="submit">Salvar</ButtonPrimary>
                </div>
              </ModalActions>
            </form>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* MODAL CRIAÇÃO/EDIÇÃO DE APOSTA */}
      {isModalApostaOpen && (
        <ModalOverlay onClick={() => setIsModalApostaOpen(false)}>
          <ModalBox
            style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {apostaEditandoId ? "Editar aposta" : "Adicionar aposta"}
              </ModalTitle>
              <CloseBtn onClick={() => setIsModalApostaOpen(false)}>×</CloseBtn>
            </ModalHeader>
            <form onSubmit={salvarAposta}>
              <div style={{ display: "flex", gap: "15px" }}>
                <FormGroup style={{ flex: 1 }}>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    required
                    value={dataAposta}
                    onChange={(e) => setDataAposta(e.target.value)}
                  />
                </FormGroup>
                <FormGroup style={{ flex: 1 }}>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    required
                    value={horaAposta}
                    onChange={(e) => setHoraAposta(e.target.value)}
                  />
                </FormGroup>
              </div>
              <FormGroup>
                <Label>Casa de apostas</Label>
                <Select
                  value={casaSelecionada}
                  onChange={(e) => setCasaSelecionada(e.target.value)}
                >
                  <option value="">Selecionar (Banca Principal)</option>
                  {bankroll.casas &&
                    bankroll.casas.map((casa) => (
                      <option key={casa.id} value={casa.id}>
                        {casa.nome_casa}
                      </option>
                    ))}
                </Select>
              </FormGroup>

              {selecoes.map((sel, index) => (
                <SelectionCard key={index}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                      Seleção {index + 1}
                    </span>
                    {selecoes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerSelecao(index)}
                        style={{
                          color: "#ef4444",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div style={{ flex: 2 }}>
                      <Label>Título</Label>
                      <Input
                        type="text"
                        required
                        value={sel.titulo}
                        onChange={(e) =>
                          atualizarSelecao(index, "titulo", e.target.value)
                        }
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Label>Odd</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={sel.cotacao}
                        onChange={(e) =>
                          atualizarSelecao(index, "cotacao", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <Label>Esporte</Label>
                      <Select
                        value={sel.esporte}
                        onChange={(e) =>
                          atualizarSelecao(index, "esporte", e.target.value)
                        }
                      >
                        <option value="Futebol">Futebol</option>
                        <option value="Basquete">Basquete</option>
                        <option value="Tênis">Tênis</option>
                        <option value="Outros">Outros</option>
                      </Select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Label>Status</Label>
                      <Select
                        value={sel.status}
                        onChange={(e) =>
                          atualizarSelecao(index, "status", e.target.value)
                        }
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Ganha">Ganha</option>
                        <option value="Perdida">Perdida</option>
                        <option value="Reembolsada">Reembolsada</option>
                      </Select>
                    </div>
                  </div>
                </SelectionCard>
              ))}

              <BtnAddSelection type="button" onClick={adicionarSelecao}>
                + Adicionar seleção (Múltipla)
              </BtnAddSelection>

              <FormGroup style={{ marginTop: "20px" }}>
                <Label>Formato</Label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <FormatToggle
                    type="button"
                    $active={formato === "Simples"}
                    onClick={() => setFormato("Simples")}
                  >
                    Simples
                  </FormatToggle>
                  {selecoes.length > 1 && (
                    <FormatToggle
                      type="button"
                      $active={formato === "Múltipla"}
                      onClick={() => setFormato("Múltipla")}
                    >
                      Múltipla
                    </FormatToggle>
                  )}
                </div>
              </FormGroup>

              <div style={{ display: "flex", gap: "15px" }}>
                <FormGroup style={{ flex: 1 }}>
                  <Label>Investido (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={valorInvestido}
                    onChange={(e) => setValorInvestido(e.target.value)}
                  />
                </FormGroup>
                <FormGroup style={{ flex: 1 }}>
                  <Label>Lucro/Prejuízo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={lucroObtido}
                    onChange={(e) => setLucroObtido(e.target.value)}
                  />
                </FormGroup>
              </div>

              <ModalActions>
                <ButtonSecondary
                  type="button"
                  onClick={() => setIsModalApostaOpen(false)}
                >
                  Cancelar
                </ButtonSecondary>
                <ButtonPrimary type="submit" style={{ flex: 1 }}>
                  Salvar Aposta
                </ButtonPrimary>
              </ModalActions>
            </form>
          </ModalBox>
        </ModalOverlay>
      )}

    {/* MODAL DE VISUALIZAÇÃO DE APOSTA */}
      {isViewModalOpen && apostaViewing && (() => {
        let dateTemp = new Date(apostaViewing.data_hora);
        if (isNaN(dateTemp.getTime())) dateTemp = new Date();
        const casaObj = bankroll.casas?.find(c => c.id === apostaViewing.casa_aposta_id);
        const nomeCasa = casaObj ? casaObj.nome_casa : '';
        const dataFormatada = dateTemp.toLocaleDateString('pt-BR');
        const horaFormatada = dateTemp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let tituloAposta = 'Aposta sem título';
        let cotacaoTotal = 1;
        if (apostaViewing.formato_aposta === 'Múltipla') {
          tituloAposta = `Múltipla ${apostaViewing.selecoes.length} Apostas`;
          cotacaoTotal = apostaViewing.selecoes.reduce((acc, sel) => acc * (Number(sel.cotacao) || 1), 1).toFixed(3);
        } else {
          tituloAposta = apostaViewing.selecoes[0]?.titulo;
          cotacaoTotal = Number(apostaViewing.selecoes[0]?.cotacao).toFixed(3);
        }
        const ganho = apostaViewing.status_geral === 'Ganha' ? (apostaViewing.valor_investido * cotacaoTotal).toFixed(2) : '0.00';

        return (
          <ModalOverlay onClick={() => setIsViewModalOpen(false)}>
            <DarkModalBox onClick={e => e.stopPropagation()}>
              <DarkModalHeader>
                <h2>{tituloAposta}</h2>
                <CloseBtn style={{ color: '#fff' }} onClick={() => setIsViewModalOpen(false)}>×</CloseBtn>
              </DarkModalHeader>
              <DarkModalSub>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#d1d5db', fontSize: '13px' }}>📅 {dataFormatada} - {horaFormatada}</span>
                  <FormatBadge>{apostaViewing.formato_aposta}</FormatBadge>
                </div>
                <StatusVertical $status={apostaViewing.status_geral} style={{ writingMode: 'horizontal-tb', transform: 'none', height: 'auto', padding: '4px 12px' }}>
                  {apostaViewing.status_geral}
                </StatusVertical>
              </DarkModalSub>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <StatCol style={{ textAlign: 'left' }}><StatLbl style={{ marginBottom: '4px' }}>Cotação</StatLbl><StatVal style={{ fontSize: '16px' }}>{cotacaoTotal}</StatVal></StatCol>
                <StatCol style={{ textAlign: 'left' }}><StatLbl style={{ marginBottom: '4px' }}>Valor</StatLbl><StatVal style={{ fontSize: '16px' }}>{apostaViewing.valor_investido.toFixed(2)}<small>R$</small></StatVal></StatCol>
                <StatCol style={{ textAlign: 'left' }}><StatLbl style={{ marginBottom: '4px' }}>Ganho</StatLbl><StatVal $status={apostaViewing.status_geral} style={{ fontSize: '16px' }}>{ganho}<small>R$</small></StatVal></StatCol>
                <StatCol style={{ textAlign: 'left' }}>
                  <StatLbl style={{ marginBottom: '4px' }}>Lucro</StatLbl>
                  <StatVal $status={apostaViewing.status_geral} style={{ fontSize: '16px' }}>{apostaViewing.lucro_obtido > 0 ? '+' : ''}{apostaViewing.lucro_obtido.toFixed(2)}<small>R$</small></StatVal>
                </StatCol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '14px', fontWeight: '600' }}>
                <span>Seleções</span>
                {nomeCasa && <CasaBadge>{nomeCasa}</CasaBadge>}
              </div>

              <div>
                {apostaViewing.selecoes.map(sel => (
                  <ViewSelItem key={sel.id}>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#d1d5db' }}>
                      <span>⚽</span>
                      <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sel.titulo}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <ViewOdd>{Number(sel.cotacao).toFixed(3)}</ViewOdd>
                      <StatusVertical $status={sel.status_selecao || 'Pendente'} style={{ writingMode: 'horizontal-tb', transform: 'none', height: 'auto', padding: '2px 8px', fontSize: '11px' }}>
                        {sel.status_selecao || 'Pendente'}
                      </StatusVertical>
                    </div>
                  </ViewSelItem>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <ViewActionBtn onClick={() => abrirModalParaEditar(apostaViewing)}>✏️ Editar</ViewActionBtn>
                <ViewActionBtn onClick={() => deletarAposta(apostaViewing.id)}>🗑️ Remover</ViewActionBtn>
              </div>
            </DarkModalBox>
          </ModalOverlay>
        );
      })()}

      {/* MODAL DE STATUS RÁPIDO */}
      {isStatusModalOpen && apostaStatusEditing && (
        <ModalOverlay onClick={() => setIsStatusModalOpen(false)}>
          <DarkModalBox style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              {apostaStatusEditing.formato_aposta === 'Múltipla' ? `Múltipla ${apostaStatusEditing.selecoes.length} Apostas` : apostaStatusEditing.selecoes[0]?.titulo}
            </h3>
            <StatusGrid>
              {['Pendente', 'Ganha', 'Perdida', 'Reembolsada', 'Meio ganho', 'Meio perdido', 'Cashout', 'Cancelado'].map(status => (
                <StatusOption key={status} $active={apostaStatusEditing.status_geral === status} $statusType={status} onClick={() => salvarStatusRapido(status)}>
                  {status}
                </StatusOption>
              ))}
            </StatusGrid>
            <div style={{ display: 'flex', gap: '12px' }}>
              <ViewActionBtn onClick={() => setIsStatusModalOpen(false)}>Fechar</ViewActionBtn>
              <ButtonPrimary style={{ flex: 1 }} onClick={() => abrirModalParaEditar(apostaStatusEditing)}>Editar Aposta</ButtonPrimary>
            </div>
          </DarkModalBox>
        </ModalOverlay>
      )}

      {/* MODAL DE FILTROS */}
      {isFilterModalOpen && (
        <ModalOverlay onClick={() => setIsFilterModalOpen(false)}>
          <FilterBox onClick={e => e.stopPropagation()}>
            <FilterHeader>
              <h2>Filtros</h2>
              <CloseBtn style={{ color: '#9ca3af' }} onClick={() => setIsFilterModalOpen(false)}>×</CloseBtn>
            </FilterHeader>
            <FilterBody>
              <FilterGrid>
                <FilterGroup><label>Data de início</label><input type="date" value={filtros.dataInicio} onChange={e => handleFiltroChange('dataInicio', e.target.value)} /></FilterGroup>
                <FilterGroup><label>Data final</label><input type="date" value={filtros.dataFim} onChange={e => handleFiltroChange('dataFim', e.target.value)} /></FilterGroup>
                <FilterGroup><label>Título da aposta</label><input type="text" placeholder="Ex: Real Madrid" value={filtros.titulo} onChange={e => handleFiltroChange('titulo', e.target.value)} /></FilterGroup>
                <FilterGroup><label>Estado</label><select value={filtros.estado} onChange={e => handleFiltroChange('estado', e.target.value)}><option value="">Selecionar</option><option value="Ganha">Ganha</option><option value="Perdida">Perdida</option><option value="Reembolsada">Reembolsada</option><option value="Pendente">Pendente</option></select></FilterGroup>
                <FilterGroup><label>Tipo</label><select value={filtros.tipoItem} onChange={e => handleFiltroChange('tipoItem', e.target.value)}><option value="">Selecionar</option><option value="Apostas">Apostas</option><option value="Depósito/Retirada">Depósito/Retirada</option></select></FilterGroup>
                <FilterGroup><label>Esporte</label><select value={filtros.esporte} onChange={e => handleFiltroChange('esporte', e.target.value)}><option value="">Selecionar</option><option value="Futebol">Futebol</option><option value="Basquete">Basquete</option><option value="Tênis">Tênis</option></select></FilterGroup>
                <FilterGroup><label>Casa de apostas</label><select value={filtros.casa} onChange={e => handleFiltroChange('casa', e.target.value)}><option value="">Selecionar</option>{bankroll.casas?.map(c => <option key={c.id} value={c.id}>{c.nome_casa}</option>)}</select></FilterGroup>
                <FilterGroup><label>Valor min (R$)</label><input type="number" placeholder="Ex: 10" value={filtros.valorMin} onChange={e => handleFiltroChange('valorMin', e.target.value)} /></FilterGroup>
                <FilterGroup><label>Valor max (R$)</label><input type="number" placeholder="Ex: 80" value={filtros.valorMax} onChange={e => handleFiltroChange('valorMax', e.target.value)} /></FilterGroup>
                <FilterGroup><label>Cotação min</label><input type="number" step="0.01" placeholder="Ex: 1.10" value={filtros.cotacaoMin} onChange={e => handleFiltroChange('cotacaoMin', e.target.value)} /></FilterGroup>
                <FilterGroup><label>Cotação max</label><input type="number" step="0.01" placeholder="Ex: 2.45" value={filtros.cotacaoMax} onChange={e => handleFiltroChange('cotacaoMax', e.target.value)} /></FilterGroup>
              </FilterGrid>
            </FilterBody>
            <FilterFooter>
              <ViewActionBtn style={{ flex: 1 }} onClick={limparFiltros}>Remover filtro</ViewActionBtn>
              <ButtonPrimary style={{ flex: 1 }} onClick={() => setIsFilterModalOpen(false)}>Filtrar</ButtonPrimary>
            </FilterFooter>
          </FilterBox>
        </ModalOverlay>
      )}

      {/* COMPONENTES EXTERNOS */}
      <StatsDrawer isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} apostas={apostasFiltradas} todasApostas={apostas} bankroll={bankroll} onUpdate={() => { carregarHistorico(); carregarDetalhesBankroll(); }} />
      <ProfitCalendar isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} apostas={apostasFiltradas} />
    </DashboardLayout>
  );
}

// --- STYLED COMPONENTS ---

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;
const PageTitle = styled.h1`
  font-size: 26px;
  color: #111827;
`;
const ActionGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ButtonPrimary = styled.button`
  background-color: #6366f1;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background-color: #4f46e5;
  }
`;
const ButtonSecondary = styled.button`
  background-color: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background-color: #f3f4f6;
  }
`;

const ChartContainer = styled.div`
  background: #fff;
  padding: 20px 20px 0 0;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
`;
const KpiCard = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
`;
const KpiLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: block;
`;
const KpiValue = styled.span`
  font-size: 26px;
  font-weight: bold;
  color: ${(props) => props.$color || "#3b82f6"};
`;

// --- DARK THEME BET LIST ---
const MonthContainer = styled.div`
  background: #0b0e14;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #1f2937;
  overflow: hidden;
`;
const MonthHeader = styled.div`
  background: #0b0e14;
  padding: 15px 20px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  color: #818cf8;
`;
const DayContainer = styled.div`
  padding: 10px 20px;
`;
const DayHeader = styled.div`
  color: #f3f4f6;
  font-size: 14px;
  font-weight: bold;
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
`;

const BetRow = styled.div`
  background: #151a23;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  margin-bottom: 8px;
  border: 1px solid #1f2937;
  color: #f3f4f6;
  transition: 0.2s;
  &:hover {
    border-color: #374151;
  }
`;
const TransactionRow = styled(BetRow)`
  border: 1px dashed #374151;
`;

const RowLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;
const DotsBtn = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
  padding: 0 5px;
  &:hover {
    color: #fff;
  }
`;
const TimeBadge = styled.span`
  background: #1f2937;
  color: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
`;
const FormatBadge = styled.span`
  background: rgba(129, 140, 248, 0.1);
  color: #818cf8;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
`;
const CasaBadge = styled.span`
  background: #374151;
  color: #d1d5db;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;
const RowTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #e5e7eb;
`;

const RowRight = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;
`;
const StatCol = styled.div`
  display: flex;
  flex-direction: column;
  text-align: right;
`;
const StatVal = styled.span`
  font-size: 14px;
  font-weight: bold;
  color: ${(props) =>
    props.$status === "Ganha"
      ? "#10b981"
      : props.$status === "Perdida"
        ? "#f43f5e"
        : props.$status === "Reembolsada"
          ? "#f59e0b"
          : "#e5e7eb"};
  small {
    font-size: 10px;
    margin-left: 2px;
  }
`;
const StatLbl = styled.span`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
`;
const TransactionValue = styled.span`
  font-size: 16px;
  font-weight: bold;
  color: ${(props) => (props.$isPositive ? "#10b981" : "#f43f5e")};
`;

const StatusVertical = styled.div`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  padding: 10px 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  text-align: center;
  height: 60px;
  background: ${(props) =>
    props.$status === "Ganha"
      ? "rgba(16,185,129,0.15)"
      : props.$status === "Perdida"
        ? "rgba(244,63,94,0.15)"
        : "rgba(156,163,175,0.15)"};
  color: ${(props) =>
    props.$status === "Ganha"
      ? "#10b981"
      : props.$status === "Perdida"
        ? "#f43f5e"
        : "#9ca3af"};
  &:hover {
    opacity: 0.8;
  }
`;

// --- MODALS BASE ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalBox = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;
const ModalTitle = styled.h2`
  font-size: 18px;
  color: #111827;
`;
const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
`;
const FormGroup = styled.div`
  margin-bottom: 15px;
`;
const Label = styled.label`
  display: block;
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 6px;
  font-weight: 500;
`;
const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  &:focus {
    border-color: #6366f1;
  }
`;
const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  &:focus {
    border-color: #6366f1;
  }
`;
const ModalActions = styled.div`display: flex; justify-content: space-between; margin-top: 25px; pt-3; border-top: 1px solid #f3f4f6; padding-top: 20px;`;
const BtnDanger = styled.button`
  background: none;
  color: #ef4444;
  border: none;
  font-weight: 600;
  cursor: pointer;
  padding: 10px;
  &:hover {
    text-decoration: underline;
  }
`;

// --- SELECTIONS ---
const SelectionCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
`;
const BtnAddSelection = styled.button`
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px dashed #9ca3af;
  color: #4b5563;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  &:hover {
    border-color: #6366f1;
    color: #6366f1;
  }
`;
const FormatToggle = styled.button`
  flex: 1;
  padding: 10px;
  border: 1px solid ${(props) => (props.$active ? "#6366f1" : "#d1d5db")};
  background: ${(props) => (props.$active ? "#e0e7ff" : "#fff")};
  color: ${(props) => (props.$active ? "#4f46e5" : "#4b5563")};
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
`;
