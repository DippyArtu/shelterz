import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

// displays a page header

export default function Header({ link, title, subTitle, ...props }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem" }}>
      <div style={{ display: "flex",  flexDirection: "column", flex: 1, alignItems: "start" }}>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <Title level={4} style={{ margin: "0 0.5rem 0 0" }}>{title}</Title>
        </a>
        <Text type="secondary" style={{ textAlign: "left" }}>{subTitle}</Text>
      </div>
      {props.children}
    </div>
  );
}

Header.defaultProps = {
  link: "https://defimoon.org/",
  title: "🌕 44 65 66 69 4d 6f 6f 6e",
  subTitle: "web3 development and blockchain security",
};
