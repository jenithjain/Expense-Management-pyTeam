"use client"

import { Chatbot } from "@/components/shared/chatbot"
import { GL } from "@/components/gl"

const EMPLOYEE_SUGGESTED_QUESTIONS = [
  "What is the status of my latest expense?",
  "Show me my pending expenses",
  "What's the per diem for Delhi travel?",
  "How do I submit a foreign currency expense?",
  "Do I need receipts for expenses under ₹500?",
  "Why was my expense rejected?",
  "When will I get reimbursed?",
  "How do I create an expense report?",
  "What expenses can I claim?",
  "How do I recall a submitted expense?"
]

export default function EmployeeAssistantPage() {
  return (
    <main className="relative min-h-svh px-4 md:px-8 py-32">
      <GL hovering={false} />
      <div className="relative z-10 max-w-5xl mx-auto">
        <Chatbot 
          variant="embedded"
          placeholder="Ask about expenses, policies, or status..."
          suggestedQuestions={EMPLOYEE_SUGGESTED_QUESTIONS}
        />
      </div>
    </main>
  )
}
