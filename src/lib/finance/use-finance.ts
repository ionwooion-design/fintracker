import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTransaction,
  askAdvisor,
  bulkDeleteTransactions,
  contributeToGoal,
  deleteCategory,
  deleteEnvelope,
  deleteFixedEvent,
  deleteGoal,
  deleteRecurring,
  deleteTransaction,
  getFinanceData,
  importSms,
  pauseRecurring,
  resetFinanceData,
  saveCategory,
  saveEnvelope,
  saveFixedEvent,
  saveGoal,
  saveRecurring,
  saveSettings,
  startNewPeriod,
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
    deleteCat: useMutation({
      mutationFn: wrap(deleteCategory),
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
    saveRecurring: useMutation({
      mutationFn: wrap(saveRecurring),
      onSuccess: setSnap,
    }),
    pauseRecurring: useMutation({
      mutationFn: wrap(pauseRecurring),
      onSuccess: setSnap,
    }),
    deleteRecurring: useMutation({
      mutationFn: wrap(deleteRecurring),
      onSuccess: setSnap,
    }),
    saveGoal: useMutation({
      mutationFn: wrap(saveGoal),
      onSuccess: setSnap,
    }),
    deleteGoal: useMutation({
      mutationFn: wrap(deleteGoal),
      onSuccess: setSnap,
    }),
    contributeToGoal: useMutation({
      mutationFn: wrap(contributeToGoal),
      onSuccess: setSnap,
    }),
    startNewPeriod: useMutation({
      mutationFn: wrap(startNewPeriod),
      onSuccess: setSnap,
    }),
  };
}
