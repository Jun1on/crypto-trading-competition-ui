"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

type ChartClickContextType = {
  clicked: boolean;
  setClicked: () => void;
};

const ChartClickContext = createContext<ChartClickContextType>({
  clicked: false,
  setClicked: () => {},
});

export const ChartClickProvider = ({ children }: { children: ReactNode }) => {
  const [clicked, setClickedState] = useState(false);
  const setClicked = () => setClickedState(true);

  return (
    <ChartClickContext.Provider value={{ clicked, setClicked }}>
      {children}
    </ChartClickContext.Provider>
  );
};

export const useChartClick = () => useContext(ChartClickContext);
