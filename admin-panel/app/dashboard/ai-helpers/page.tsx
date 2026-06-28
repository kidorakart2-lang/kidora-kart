"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIHelperConfig {
  _id?: string;
  geminiApiKey?: string;
  geminiModel: string;
  dailyTokenBudget: number;
  enabled: boolean;
  systemPrompt?: string;
}

const AXIOS_CONFIG = { withCredentials: true } as const

function isAxiosError(error: unknown): error is { response?: { data?: { _message?: string } }; message?: string } {
  return typeof error === "object" && error !== null && ("response" in error || "message" in error);
}

const GEMINI_MODELS = [
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "gemini-pro-vision", label: "Gemini Pro Vision" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
]

export default function AIHelpersPage() {
  const [config, setConfig] = useState<AIHelperConfig>({
    geminiApiKey: "",
    geminiModel: "gemini-2.0-flash",
    dailyTokenBudget: 100000,
    enabled: false,
    systemPrompt: "",
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await axios.post(
        `/api/admin/ai-helpers/view`,
        {},
        AXIOS_CONFIG
      )
      const data = response.data._data
      if (data) {
        setConfig({
          geminiApiKey: data.geminiApiKey || "",
          geminiModel: data.geminiModel || "gemini-2.0-flash",
          dailyTokenBudget: data.dailyTokenBudget || 100000,
          enabled: data.enabled ?? false,
          systemPrompt: data.systemPrompt || "",
        })
      }
    } catch {
      // first load, use defaults
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        geminiApiKey: config.geminiApiKey,
        geminiModel: config.geminiModel,
        dailyTokenBudget: config.dailyTokenBudget,
        enabled: config.enabled,
        systemPrompt: config.systemPrompt,
      }

      const response = await axios.post(
        `/api/admin/ai-helpers/create-or-update`,
        payload,
        AXIOS_CONFIG
      )

      if (response.data._status) {
        toast({ title: "AI Helper settings saved successfully" })
      } else {
        toast({
          title: response.data._message || "Error saving settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error saving AI Helper settings",
        description: isAxiosError(error) ? error.response?.data?._message || "Operation failed" : "Operation failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Helpers</h1>
          <p className="text-muted-foreground">Configure AI-powered assistant settings</p>
        </div>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Gemini AI Configuration</CardTitle>
          </div>
          <CardDescription>
            Set up your Google Gemini API integration for AI-powered features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">Gemini API Key</Label>
              <Input
                id="geminiApiKey"
                type="password"
                value={config.geminiApiKey}
                onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                placeholder="Enter your Google Gemini API key"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="geminiModel">Model</Label>
              <Select
                value={config.geminiModel}
                onValueChange={(value) => setConfig({ ...config, geminiModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GEMINI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyTokenBudget">Daily Token Budget</Label>
              <Input
                id="dailyTokenBudget"
                type="number"
                value={config.dailyTokenBudget}
                onChange={(e) => setConfig({ ...config, dailyTokenBudget: Number.parseInt(e.target.value) })}
                min="1000"
                step="1000"
              />
              <p className="text-xs text-muted-foreground">
                Maximum tokens the AI helper can consume per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt (optional)</Label>
              <textarea
                id="systemPrompt"
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Instructions for the AI assistant behavior..."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-base">Enable AI Helper</Label>
                <p className="text-sm text-muted-foreground">
                  Allow AI-powered features across the storefront
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
