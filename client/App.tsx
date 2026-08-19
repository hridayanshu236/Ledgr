import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import CaptureScreen from "./screens/CaptureScreen";
import HomeScreen from "./screens/HomeScreen";
import ReviewScreen from "./screens/ReviewScreen";
import { TransactionBatch } from "./lib/types";

type Screen = "home" | "capture" | "review";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [pendingBatch, setPendingBatch] = useState<TransactionBatch | null>(null);

  function handleCaptureResult(batch: TransactionBatch) {
    setPendingBatch(batch);
    setScreen("review");
  }

  function handleConfirmed() {
    setPendingBatch(null);
    setScreen("home");
  }

  return (
    <>
      <StatusBar style="light" />
      {screen === "home" && (
        <HomeScreen onCapture={() => setScreen("capture")} />
      )}
      {screen === "capture" && (
        <CaptureScreen
          onResult={handleCaptureResult}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "review" && pendingBatch && (
        <ReviewScreen
          batch={pendingBatch}
          onConfirmed={handleConfirmed}
          onBack={() => setScreen("capture")}
        />
      )}
    </>
  );
}
