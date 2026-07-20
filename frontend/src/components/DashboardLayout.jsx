import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

export default function DashboardLayout({ children, currentBankrollName }) {
  return (
    <Container>
      <Sidebar>
        <Logo>Branks</Logo>
        
        {!currentBankrollName && (
          <SidebarLink to="/">
            Bankrolls
          </SidebarLink>
        )}

        {currentBankrollName && (
          <>
            <BackLink to="/">← Voltar</BackLink>
            <CurrentBankrollBox>
              <BoxLabel>ATUAL</BoxLabel>
              <BoxTitle>{currentBankrollName}</BoxTitle>
            </CurrentBankrollBox>
          </>
        )}
      </Sidebar>
      <MainContent>
        {children}
      </MainContent>
    </Container>
  );
}

// --- STYLED COMPONENTS ---

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #0b0e14;
`;

const Sidebar = styled.aside`
  width: 260px;
  background-color: #0b0e14;
  border-right: 1px solid #1f2937;
  padding: 24px;
`;

const Logo = styled.h2`
  color: #f3f4f6;
  margin-bottom: 32px;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
`;

const SidebarLink = styled(Link)`
  color: #818cf8;
  text-decoration: none;
  font-weight: 600;
  display: block;
  margin-bottom: 20px;
  padding: 10px 15px;
  background: rgba(129, 140, 248, 0.1);
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(129, 140, 248, 0.15);
  }
`;

const BackLink = styled(Link)`
  color: #9ca3af;
  text-decoration: none;
  font-weight: 600;
  display: block;
  margin-bottom: 20px;
  transition: all 0.2s;
  
  &:hover {
    color: #f3f4f6;
  }
`;

const CurrentBankrollBox = styled.div`
  padding: 15px;
  background-color: #151a23;
  border: 1px solid #1f2937;
  border-radius: 8px;
`;

const BoxLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: 700;
  display: block;
  text-transform: uppercase;
`;

const BoxTitle = styled.h3`
  font-size: 15px;
  color: #f3f4f6;
  margin-top: 5px;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 32px;
`;