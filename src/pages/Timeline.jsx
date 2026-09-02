import React from 'react';
import { Navigate } from 'react-router-dom';

// 🔵 BUG-029 FIX: Arquivo vazio anterior causava possíveis quebras de import.
// A timeline agora é incorporada via AulasTimeline na Agenda.
export default function Timeline() {
  return <Navigate to="/agenda" replace />;
}
