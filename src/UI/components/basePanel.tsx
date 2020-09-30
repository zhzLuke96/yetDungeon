import React from 'react';
import styled from 'styled-components';

interface BasePanelProps {
  title?: string;
  fontColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
}
export const BasePanel: React.FC<BasePanelProps> = React.memo((props) => {
  const {
    title = 'Panel',
    borderColor = 'white',
    backgroundColor = 'black',
    fontColor = backgroundColor,
    style,
    children,
  } = props;
  return (
    <Container style={{ border: `2px solid ${borderColor}`, ...style }}>
      <TitleContainer
        style={{ color: fontColor, backgroundColor: borderColor }}
      >
        {title}
      </TitleContainer>
      <ContentContainer>{children}</ContentContainer>
    </Container>
  );
});

BasePanel.displayName = 'BasePanel';

const Container = styled.div`
  margin: 0.5rem;
  position: relative;
  width: calc(100% - 1rem);
  height: calc(100% - 1rem);
  font-size: 12px;
`;

const TitleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: Console;
  font-weight: 900;
  padding: 0 0.5rem;
  font-size: 1rem;
`;

const ContentContainer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`;
