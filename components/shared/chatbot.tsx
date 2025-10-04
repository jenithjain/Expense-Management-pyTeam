"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/shared/glass-card"
import { StatisticsCharts } from "@/components/shared/statistics-charts"
import { MessageCircle, Send, X, Loader2, Sparkles, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'text' | 'statistics'
  statistics?: any
  userRole?: string
}

interface ChatbotProps {
  variant?: 'floating' | 'embedded'
  placeholder?: string
  suggestedQuestions?: string[]
}

export function Chatbot({ 
  variant = 'floating',
  placeholder = "Ask me anything about expenses...",
  suggestedQuestions = []
}: ChatbotProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${session?.user?.name || 'there'}! 👋 I'm your expense management assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API error:', response.status, errorData)
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()

      // Check if this is a statistics response
      if (data.type === 'statistics' && data.stats) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: 'Here are the analytics and statistics you requested:',
          timestamp: new Date(),
          type: 'statistics',
          statistics: data.stats,
          userRole: data.userRole
        }
        setMessages(prev => [...prev, assistantMessage])
      } else if (data.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          type: 'text'
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('No response from server')
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive"
      })

      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // Render the chat content directly
  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini AI</p>
          </div>
        </div>
        {variant === 'floating' && (
          <Button
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 bg-transparent border-transparent shadow-none hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'statistics' ? (
              <div className="w-full">
                <div className="bg-white/3 backdrop-blur-sm border border-white/5 rounded-2xl px-4 py-2 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <StatisticsCharts 
                  data={message.statistics} 
                  userRole={message.userRole as 'MANAGER' | 'ADMIN'} 
                />
              </div>
            ) : (
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/3 backdrop-blur-sm border border-white/5'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/3 backdrop-blur-sm border border-white/5 rounded-2xl px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && suggestedQuestions.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <Button
                key={index}
                size="sm"
                onClick={() => handleSendMessage(question)}
                className="text-xs h-auto py-1.5 px-3"
                disabled={isLoading}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            autoComplete="off"
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/40 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
          <Button
            type="submit"
            onClick={(e) => { e.preventDefault(); handleSendMessage(); }}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )

  if (variant === 'embedded') {
    return (
      <GlassCard className="h-[600px]">
        {chatContent}
      </GlassCard>
    )
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50">
          <GlassCard className="h-full shadow-2xl">
            {chatContent}
          </GlassCard>
        </div>
      )}
    </>
  )
}
