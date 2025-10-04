"use client"

import { Chatbot } from "@/components/shared/chatbot"
import { GL } from "@/components/gl"

const MANAGER_SUGGESTED_QUESTIONS = [
  "How many expenses are pending my approval?",
  "Show me pending expenses over ₹10,000",
  "What's my team's total spend this month?",
  "Who are the top 3 spenders on my team?",
  "Show me all rejected expenses from last week",
  "What's the approval chain for international travel?",
  "Which category does my team spend most on?",
  "Show me expenses waiting for CFO approval",
  "What's the average expense amount this quarter?",
  "Are there any policy violations pending?"
]

export default function ManagerAssistantPage() {
  return (
    <main className="relative min-h-svh px-4 md:px-8 py-32">
      <GL hovering={false} />
      <div className="relative z-10 max-w-5xl mx-auto">
        <Chatbot 
          variant="embedded"
          placeholder="Ask about approvals, team spending, or analytics..."
          suggestedQuestions={MANAGER_SUGGESTED_QUESTIONS}
        />
      </div>
    </main>
  )
}
