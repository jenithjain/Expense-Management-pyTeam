"use client"

import { Chatbot } from "@/components/shared/chatbot"
import { GL } from "@/components/gl"

const ADMIN_SUGGESTED_QUESTIONS = [
  "Who is the manager for Sameer Gupta?",
  "What's the approval rule for Marketing department?",
  "Show me the approval sequence for expenses over ₹50,000",
  "Is CFO auto-approval currently active?",
  "How many users are in the system?",
  "What are the current policy limits?",
  "Show me all approval rules",
  "Which departments have custom approval workflows?",
  "What's the company-wide spending this month?",
  "How many pending expenses are in the system?"
]

export default function AdminAssistantPage() {
  return (
    <main className="relative min-h-svh px-4 md:px-8 py-32">
      <GL hovering={false} />
      <div className="relative z-10 max-w-5xl mx-auto">
        <Chatbot 
          variant="embedded"
          placeholder="Ask about system config, users, or policies..."
          suggestedQuestions={ADMIN_SUGGESTED_QUESTIONS}
        />
      </div>
    </main>
  )
}
