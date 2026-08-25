import axios from "axios";
import { BACKEND_URL } from "../constants/config";
import { TransactionBatch, TransactionItem } from "./types";

export const api = axios.create({ baseURL: BACKEND_URL });

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export async function ingestFile(
  uri: string,
  mimeType: string,
  filename: string
): Promise<TransactionBatch> {
  const form = new FormData();
  form.append("file", { uri, type: mimeType, name: filename } as any);
  const { data } = await api.post<TransactionBatch>("/api/v1/ingest/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function confirmBatch(
  batch: TransactionBatch
): Promise<TransactionBatch> {
  const { data } = await api.post<TransactionBatch>(
    "/api/v1/transactions/confirm/",
    batch
  );
  return data;
}

export interface GetTransactionsParams {
  search?: string;
  month?: string;
  category?: string;
  payment_method?: string;
  sort_by?: "date" | "amount";
  sort_order?: "asc" | "desc";
}

export async function getTransactions(params?: GetTransactionsParams): Promise<TransactionItem[]> {
  const { data } = await api.get<TransactionItem[]>("/api/v1/transactions/", { params });
  return data;
}

export async function askQuestion(
  question: string,
  history?: { role: string; content: string }[]
): Promise<string> {
  const { data } = await api.post<{ answer: string }>("/api/v1/query/", {
    question,
    history,
  });
  return data.answer;
}

export async function updateTransaction(id: string, tx: TransactionItem): Promise<TransactionItem> {
  const { data } = await api.put<TransactionItem>(`/api/v1/transactions/${id}`, tx);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/api/v1/transactions/${id}`);
}

export async function login(email: string, password: string): Promise<string> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  
  const { data } = await api.post<{ access_token: string }>("/api/v1/auth/login", formData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return data.access_token;
}

export async function register(email: string, password: string): Promise<void> {
  await api.post("/api/v1/auth/register", { email, password });
}

export async function getUserSettings(): Promise<{ id: string; email: string; api_key: string | null }> {
  const { data } = await api.get("/api/v1/auth/me");
  return data;
}

export async function updateUserSettings(settings: { api_key?: string, push_token?: string }): Promise<void> {
  await api.put("/api/v1/auth/settings", settings);
}
