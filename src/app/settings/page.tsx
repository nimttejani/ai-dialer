'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings & Configuration</h1>
      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="call-automation">Call Automation</TabsTrigger>
          <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Integration Settings</CardTitle>
              <CardDescription>Configure your API keys and integration settings for various services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">VAPI Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vapi-api-key">API Key</Label>
                    <Input id="vapi-api-key" placeholder="Enter VAPI API Key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vapi-agent-id">Voice Agent ID</Label>
                    <Input id="vapi-agent-id" placeholder="Enter Voice Agent ID" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cal.com Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calcom-api-key">API Key</Label>
                    <Input id="calcom-api-key" placeholder="Enter Cal.com API Key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calcom-event-type">Event Type URL/ID</Label>
                    <Input id="calcom-event-type" placeholder="e.g., demo-call-30min" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="calcom-time-slots">Available time slots configuration</Label>
                    <Textarea id="calcom-time-slots" placeholder="Configure available time slots" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calcom-duration">Default meeting duration (minutes)</Label>
                    <Input id="calcom-duration" type="number" placeholder="30" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resend Email Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resend-api-key">API Key</Label>
                    <Input id="resend-api-key" placeholder="Enter Resend API Key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resend-from-email">From email address</Label>
                    <Input id="resend-from-email" type="email" placeholder="noreply@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resend-reply-to">Reply-to email address</Label>
                    <Input id="resend-reply-to" type="email" placeholder="support@example.com" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="call-automation">
          <Card>
            <CardHeader>
              <CardTitle>Call Automation Settings</CardTitle>
              <CardDescription>Configure your call automation and voice agent settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Call Attempt Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-calls-batch">Maximum calls per batch</Label>
                    <Input id="max-calls-batch" type="number" placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retry-interval">Time between retry attempts (hours)</Label>
                    <Input id="retry-interval" type="number" placeholder="4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Maximum attempts per lead</Label>
                    <Input id="max-attempts" type="number" placeholder="2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="active-hours">Active hours for calling</Label>
                    <Input id="active-hours" placeholder="9 AM - 5 PM" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="time-zone">Time zone setting</Label>
                    <Select>
                      <SelectTrigger id="time-zone">
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america/new_york">America/New York</SelectItem>
                        <SelectItem value="america/chicago">America/Chicago</SelectItem>
                        <SelectItem value="america/denver">America/Denver</SelectItem>
                        <SelectItem value="america/los_angeles">America/Los Angeles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Voice Agent Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="call-script">Call script text/configuration</Label>
                    <Textarea id="call-script" placeholder="Enter call script" className="min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voice-selection">Voice selection</Label>
                    <Select>
                      <SelectTrigger id="voice-selection">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="voice1">Voice 1</SelectItem>
                        <SelectItem value="voice2">Voice 2</SelectItem>
                        <SelectItem value="voice3">Voice 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="custom-params">Custom parameters for the voice agent</Label>
                    <Textarea id="custom-params" placeholder="Enter custom parameters" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="email-templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Template Settings</CardTitle>
              <CardDescription>Configure your email templates for follow-ups and appointment confirmations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Follow-up Email</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="followup-subject">Subject line</Label>
                    <Input id="followup-subject" placeholder="Enter subject line" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="followup-body">Email body template</Label>
                    <Textarea id="followup-body" placeholder="Enter email body (use {company_name} for variables)" className="min-h-[150px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followup-delay">Send delay after last call attempt (hours)</Label>
                    <Input id="followup-delay" type="number" placeholder="24" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Appointment Confirmation Email</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="confirmation-subject">Subject line</Label>
                    <Input id="confirmation-subject" placeholder="Enter subject line" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="confirmation-body">Email body template</Label>
                    <Textarea id="confirmation-body" placeholder="Enter email body" className="min-h-[150px]" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="include-calendar-invite" />
                    <Label htmlFor="include-calendar-invite">Include calendar invite</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="mt-6 flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}

