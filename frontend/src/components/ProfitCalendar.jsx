import React, { useState } from 'react';
import styled from 'styled-components';

export default function ProfitCalendar({ isOpen, onClose, apostas }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isOpen) return null;

  const lucrosPorDia = {};
  apostas.forEach(aposta => {
    const dataIso = aposta.data_hora.split('T')[0];
    if (!lucrosPorDia[dataIso]) lucrosPorDia[dataIso] = 0;
    lucrosPorDia[dataIso] += Number(aposta.lucro_obtido || 0);
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const diasNoMes = new Date(year, month + 1, 0).getDate();
  const primeiroDiaDaSemana = new Date(year, month, 1).getDay();
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const celulas = [];
  for (let i = 0; i < primeiroDiaDaSemana; i++) {
    celulas.push(<Cell key={`empty-${i}`} $empty />);
  }

  for (let d = 1; d <= diasNoMes; d++) {
    const mesFormatado = String(month + 1).padStart(2, '0');
    const diaFormatado = String(d).padStart(2, '0');
    const dataString = `${year}-${mesFormatado}-${diaFormatado}`;
    
    const lucroDoDia = lucrosPorDia[dataString];
    const isProfit = lucroDoDia > 0;
    const isLoss = lucroDoDia < 0;

    celulas.push(
      <Cell key={d} $profit={isProfit} $loss={isLoss}>
        <span>{d}</span>
        {lucroDoDia !== undefined && lucroDoDia !== 0 && (
          <CellVal>
            {lucroDoDia > 0 ? '+' : ''}{lucroDoDia.toFixed(1)}
          </CellVal>
        )}
      </Cell>
    );
  }

  return (
    <Overlay onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <Header>
          <h2>Calendário de Lucros</h2>
          <button onClick={onClose}>×</button>
        </Header>
        
        <NavHeader>
          <NavBtn onClick={prevMonth}>&lt;</NavBtn>
          <h3>{mesesNomes[month]} {year}</h3>
          <NavBtn onClick={nextMonth}>&gt;</NavBtn>
        </NavHeader>

        <DaysGrid>
          {diasDaSemana.map(dia => <DayName key={dia}>{dia}</DayName>)}
        </DaysGrid>
        
        <CalendarGrid>
          {celulas}
        </CalendarGrid>

        <Legend>
          <span><ColorBox $color="#10b981" /> Lucro</span>
          <span><ColorBox $color="#ef4444" /> Prejuízo</span>
        </Legend>
      </ModalBox>
    </Overlay>
  );
}

// --- STYLED COMPONENTS ---
const Overlay = styled.div`position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;`;
const ModalBox = styled.div`background: #fff; padding: 25px; border-radius: 12px; width: 100%; max-width: 420px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;
const Header = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; h2 { font-size: 18px; color: #111827; margin: 0; } button { background: none; border: none; font-size: 24px; color: #6b7280; cursor: pointer; }`;
const NavHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h3 { font-size: 16px; margin: 0; color: #374151; }`;
const NavBtn = styled.button`background: #f3f4f6; color: #374151; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; &:hover { background: #e5e7eb; }`;
const DaysGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 10px;`;
const DayName = styled.div`text-align: center; font-weight: bold; font-size: 12px; color: #6b7280;`;
const CalendarGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;`;
const Cell = styled.div`
  aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 6px; font-size: 14px; font-weight: bold;
  background: ${props => props.$profit ? '#10b981' : props.$loss ? '#ef4444' : props.$empty ? 'transparent' : '#f9fafb'};
  color: ${props => (props.$profit || props.$loss) ? '#fff' : props.$empty ? 'transparent' : '#374151'};
  border: ${props => props.$empty ? 'none' : '1px solid'};
  border-color: ${props => props.$profit ? '#10b981' : props.$loss ? '#ef4444' : '#e5e7eb'};
`;
const CellVal = styled.span`font-size: 10px; margin-top: 2px; font-weight: 500;`;
const Legend = styled.div`margin-top: 20px; display: flex; gap: 15px; justify-content: center; font-size: 12px; color: #6b7280; span { display: flex; align-items: center; gap: 5px; }`;
const ColorBox = styled.div`width: 12px; height: 12px; border-radius: 3px; background: ${props => props.$color};`;