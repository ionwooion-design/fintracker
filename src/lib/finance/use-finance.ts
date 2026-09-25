import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTransaction,
  askAdvisor,
  bulkDeleteTransactions,
  deleteEnvelope,
  deleteFixedEvent,
  deleteTransaction,
  getFinanceData,
  importSms,
  resetFinanceData,
  saveCategory,
  saveEnvelope,
  saveFixedEvent,
  saveSettings,
  updateTransaction,
} from "./actions";
import { computeDashboard } from "./calc";
import type { FinanceSnapshot } from "./types";

const KEY = ["finance"] as const;

export function useFinance() {
  const query = useQuery({
    queryKey: KEY,
    queryFn: () => getFinanceData(),
  });
  const computed = query.data ? computeDashboard(query.data) : null;
  return { ...query, snapshot: query.data, computed };
}

function wrap<T, R>(fn: (opts: { data: T }) => Promise<R>) {
  return (data: T) => fn({ data });
}

export function useFinanceMutations() {
  const qc = useQueryClient();
  const setSnap = (data: FinanceSnapshot) => qc.setQueryData(KEY, data);
  return {
    addTx: useMutation({
      mutationFn: wrap(addTransaction),
      onSuccess: setSnap,
    }),
    updateTx: useMutation({
      mutationFn: wrap(updateTransaction),
      onSuccess: setSnap,
    }),
    deleteTx: useMutation({
      mutationFn: wrap(deleteTransaction),
      onSuccess: setSnap,
    }),
    bulkDelete: useMutation({
      mutationFn: wrap(bulkDeleteTransactions),
      onSuccess: setSnap,
    }),
    saveEnv: useMutation({
      mutationFn: wrap(saveEnvelope),
      onSuccess: setSnap,
    }),
    deleteEnv: useMutation({
      mutationFn: wrap(deleteEnvelope),
      onSuccess: setSnap,
    }),
    saveCat: useMutation({
      mutationFn: wrap(saveCategory),
      onSuccess: setSnap,
    }),
    saveEvent: useMutation({
      mutationFn: wrap(saveFixedEvent),
      onSuccess: setSnap,
    }),
    deleteEvent: useMutation({
      mutationFn: wrap(deleteFixedEvent),
      onSuccess: setSnap,
    }),
    saveSettings: useMutation({
      mutationFn: wrap(saveSettings),
      onSuccess: setSnap,
    }),
    reset: useMutation({
      mutationFn: () => resetFinanceData(),
      onSuccess: setSnap,
    }),
    importSms: useMutation({
      mutationFn: (text: { text: string }) => importSms({ data: text }),
      onSuccess: (res) => qc.setQueryData(KEY, res.snap),
    }),
    askAi: useMutation({ mutationFn: () => askAdvisor() }),
  };
}
