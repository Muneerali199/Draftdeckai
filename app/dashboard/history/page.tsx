import { Metadata } from "next";
import { HistoryDashboard } from "@/components/dashboard/history-dashboard";

export const metadata: Metadata = {
  title: "History | DraftDeckAI",
  description: "View all your created content - resumes, presentations, diagrams, websites, and campaigns",
};

export default function HistoryPage() {
  return <HistoryDashboard />;
}
