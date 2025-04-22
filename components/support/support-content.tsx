"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SupportContactInfo from "@/components/support/support-contact-info"
import SupportTicketForm from "@/components/support/support-ticket-form"
import SupportTicketsList from "@/components/support/support-tickets-list"

interface SupportContentProps {
  user: any // Using any for simplicity, but should be properly typed
}

export default function SupportContent({ user }: SupportContentProps) {
  const [activeTab, setActiveTab] = useState("contact")
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  const handleTicketSubmitted = () => {
    setTicketSubmitted(true)
    // Switch to the "My Tickets" tab after successful submission
    setActiveTab("tickets")
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="contact" className="tab-button">
          Contact
        </TabsTrigger>
        <TabsTrigger value="new-ticket" className="tab-button">
          New Ticket
        </TabsTrigger>
        <TabsTrigger value="tickets" className="tab-button">
          My Tickets
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contact" className="mt-6">
        <SupportContactInfo />
      </TabsContent>

      <TabsContent value="new-ticket" className="mt-6">
        <SupportTicketForm user={user} onTicketSubmitted={handleTicketSubmitted} />
      </TabsContent>

      <TabsContent value="tickets" className="mt-6">
        <SupportTicketsList userId={user.id} hospitalId={user.hospital_id} refreshTrigger={ticketSubmitted} />
      </TabsContent>
    </Tabs>
  )
}
