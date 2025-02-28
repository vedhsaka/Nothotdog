"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Sparkles, Plus, FileText, Search, MoreHorizontal, Trash2, Edit, ArrowUpDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define metric types
type MetricType =
  | "Binary Qualitative"
  | "Numeric"
  | "Binary Workflow Adherence (always)"
  | "Continuous Qualitative"
  | "Enum"

type Criticality = "Low" | "Medium" | "High"

interface Metric {
  id: string
  name: string
  description?: string
  type: MetricType
  successCriteria?: string
  criticality?: Criticality
  createdAt?: string
}

export default function MetricsPage() {
  // Sample data
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: "1",
      name: "First Contact Resolution",
      description: "Whether the customer issue was resolved in the first interaction",
      type: "Binary Qualitative",
      successCriteria: "Issue completely resolved without follow-up needed",
      criticality: "High",
      createdAt: "2023-11-10",
    },
    {
      id: "2",
      name: "Response Time",
      description: "Time taken to respond to customer inquiry",
      type: "Numeric",
      successCriteria: "Less than 4 hours",
      criticality: "Medium",
      createdAt: "2023-11-09",
    },
    {
      id: "3",
      name: "Customer Satisfaction",
      description: "Overall satisfaction rating provided by customer",
      type: "Continuous Qualitative",
      successCriteria: "Rating of 4 or higher on 5-point scale",
      criticality: "High",
      createdAt: "2023-11-08",
    },
    {
      id: "4",
      name: "Greeting Protocol Followed",
      description: "Agent followed the standard greeting protocol",
      type: "Binary Workflow Adherence (always)",
      successCriteria: "All required greeting elements present",
      criticality: "Low",
      createdAt: "2023-11-07",
    },
    {
      id: "5",
      name: "Issue Categorization",
      description: "Proper categorization of customer issue type",
      type: "Enum",
      successCriteria: "Correct category selected from available options",
      criticality: "Medium",
      createdAt: "2023-11-06",
    },
  ])

  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const initialFormState = {
    name: "",
    description: "",
    type: "Binary Qualitative" as MetricType,
    successCriteria: "",
    criticality: "Medium" as Criticality,
  }

  const [formData, setFormData] = useState(initialFormState)
  const [editingMetric, setEditingMetric] = useState<string | null>(null)

  // Filter metrics based on search query and active tab
  const filteredMetrics = metrics.filter((metric) => {
    const matchesSearch =
      metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metric.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false

    if (activeTab === "all") return matchesSearch
    return matchesSearch && metric.criticality?.toLowerCase() === activeTab.toLowerCase()
  })

  // Handle row selection
  const toggleRowSelection = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id))
    } else {
      setSelectedRows([...selectedRows, id])
    }
  }

  // Handle select all rows
  const toggleSelectAll = () => {
    if (selectedRows.length === filteredMetrics.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredMetrics.map((metric) => metric.id))
    }
  }

  // Handle delete metrics
  const handleDeleteMetrics = () => {
    setMetrics(metrics.filter((metric) => !selectedRows.includes(metric.id)))
    setSelectedRows([])
  }

  // Handle edit metric
  const handleEditMetric = (id: string) => {
    const metricToEdit = metrics.find((m) => m.id === id)
    if (metricToEdit) {
      setFormData({
        name: metricToEdit.name,
        description: metricToEdit.description || "",
        type: metricToEdit.type,
        successCriteria: metricToEdit.successCriteria || "",
        criticality: metricToEdit.criticality || "Medium",
      })
      setEditingMetric(id)
      setIsModalOpen(true)
    }
  }

  // Handle save metric
  const handleSaveMetric = () => {
    if (editingMetric) {
      // Update existing metric
      setMetrics(metrics.map((metric) => (metric.id === editingMetric ? { ...metric, ...formData } : metric)))
    } else {
      // Create new metric with proper typing
      const newMetric: Metric = {
        id: (metrics.length + 1).toString(),
        name: formData.name,
        description: formData.description,
        type: formData.type as MetricType, // Ensure type is cast as MetricType
        successCriteria: formData.successCriteria,
        criticality: formData.criticality as Criticality, // Also ensure criticality is properly typed
        createdAt: new Date().toISOString().split("T")[0],
      }
      setMetrics([...metrics, newMetric])
    }

    // Reset form and close modal
    setFormData(initialFormState)
    setEditingMetric(null)
    setIsModalOpen(false)
  }

  // Get criticality badge color
  const getCriticalityColor = (criticality?: Criticality) => {
    switch (criticality) {
      case "High":
        return "destructive"
      case "Medium":
        return "warning"
      case "Low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
              <p className="text-muted-foreground mt-1">Manage and track your quality assurance metrics</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2 h-9">
                <Sparkles size={16} className="text-primary" />
                <span>Generate</span>
              </Button>
              <Button
                className="gap-2 h-9"
                onClick={() => {
                  setFormData(initialFormState)
                  setEditingMetric(null)
                  setIsModalOpen(true)
                }}
              >
                <Plus size={16} />
                <span>Create Metric</span>
              </Button>
              <Button variant="outline" className="gap-2 h-9">
                <FileText size={16} />
                <span>Templates</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="p-4 pb-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search metrics..."
                      className="pl-8 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Tabs
                      defaultValue="all"
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full sm:w-auto"
                    >
                      <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="high">High</TabsTrigger>
                        <TabsTrigger value="medium">Medium</TabsTrigger>
                        <TabsTrigger value="low">Low</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {selectedRows.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={handleDeleteMetrics} className="h-9">
                        <Trash2 size={16} className="mr-1" />
                        Delete ({selectedRows.length})
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-md mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              checked={selectedRows.length === filteredMetrics.length && filteredMetrics.length > 0}
                              onChange={toggleSelectAll}
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            Name
                            <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                          </div>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">Type</TableHead>
                        <TableHead className="hidden lg:table-cell">Success Criteria</TableHead>
                        <TableHead>Criticality</TableHead>
                        <TableHead className="hidden sm:table-cell">Created</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMetrics.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No metrics found. Create your first metric to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMetrics.map((metric) => (
                          <TableRow key={metric.id} className="group">
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300"
                                  checked={selectedRows.includes(metric.id)}
                                  onChange={() => toggleRowSelection(metric.id)}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{metric.name}</div>
                              <div className="text-sm text-muted-foreground md:hidden">{metric.type}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline">{metric.type}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell max-w-xs truncate">
                              {metric.successCriteria}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getCriticalityColor(metric.criticality)}>{metric.criticality}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {metric.createdAt}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal size={16} />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditMetric(metric.id)}>
                                    <Edit size={14} className="mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setMetrics(metrics.filter((m) => m.id !== metric.id))
                                    }}
                                  >
                                    <Trash2 size={14} className="mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingMetric ? "Edit Metric" : "Create New Metric"}</DialogTitle>
            <DialogClose className="absolute right-4 top-4" />
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Metric Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter metric name"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter metric description"
                rows={3}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="type">Metric Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as MetricType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metric type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Binary Qualitative">Binary Qualitative</SelectItem>
                  <SelectItem value="Numeric">Numeric</SelectItem>
                  <SelectItem value="Binary Workflow Adherence (always)">Binary Workflow Adherence</SelectItem>
                  <SelectItem value="Continuous Qualitative">Continuous Qualitative</SelectItem>
                  <SelectItem value="Enum">Enum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="successCriteria">Success Criteria</Label>
              <Textarea
                id="successCriteria"
                name="successCriteria"
                value={formData.successCriteria}
                onChange={(e) => setFormData({ ...formData, successCriteria: e.target.value })}
                placeholder="Define what constitutes success for this metric"
                rows={2}
              />
            </div>

            <div className="grid gap-3">
              <Label>Criticality</Label>
              <RadioGroup
                value={formData.criticality}
                onValueChange={(value) => setFormData({ ...formData, criticality: value as Criticality })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Low" id="criticality-low" />
                  <Label htmlFor="criticality-low" className="cursor-pointer">
                    Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Medium" id="criticality-medium" />
                  <Label htmlFor="criticality-medium" className="cursor-pointer">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="High" id="criticality-high" />
                  <Label htmlFor="criticality-high" className="cursor-pointer">
                    High
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFormData(initialFormState)
                setEditingMetric(null)
                setIsModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMetric}>{editingMetric ? "Save Changes" : "Create Metric"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

