import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  User,
  Target,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

interface SalesCase {
  id: string;
  caseNumber: string;
  title: string;
  customerId?: string;
  status: string;
  estimatedValue?: string;
  probability: number;
  expectedCloseDate?: string;
  ownerUserId?: string;
  description?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface SalesActivity {
  id: string;
  salesCaseId: string;
  activityType: string;
  subject: string;
  description?: string;
  outcome: string;
  scheduledAt: string;
  completedAt?: string;
  ownerUserId?: string;
  createdAt: string;
}

interface SalesNote {
  id: string;
  salesCaseId: string;
  content: string;
  visibility: string;
  authorUserId?: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", color: "bg-slate-500", probability: 10 },
  { id: "discovery", label: "Discovery", color: "bg-blue-500", probability: 30 },
  { id: "proposal", label: "Proposal", color: "bg-purple-500", probability: 50 },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500", probability: 70 },
  { id: "won", label: "Won", color: "bg-green-500", probability: 100 },
  { id: "lost", label: "Lost", color: "bg-red-500", probability: 0 },
];

const ACTIVITY_TYPES = [
  { id: "meeting", label: "Meeting", icon: User },
  { id: "call", label: "Call", icon: Phone },
  { id: "email", label: "Email", icon: Mail },
  { id: "other", label: "Other", icon: FileText },
];

const OUTCOMES = [
  { id: "planned", label: "Planned" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No Show" },
];

export default function SalesCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SalesCase>>({});
  const [newActivity, setNewActivity] = useState({
    activityType: "meeting",
    subject: "",
    description: "",
    scheduledAt: "",
  });
  const [newNote, setNewNote] = useState({
    content: "",
    visibility: "internal",
  });

  const { data: salesCase, isLoading } = useQuery<SalesCase>({
    queryKey: ["/api/sales-cases", id],
    enabled: !!id,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: activities = [] } = useQuery<SalesActivity[]>({
    queryKey: ["/api/sales-cases", id, "activities"],
    enabled: !!id,
  });

  const { data: notes = [] } = useQuery<SalesNote[]>({
    queryKey: ["/api/sales-cases", id, "notes"],
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SalesCase>) =>
      apiRequest("PUT", `/api/sales-cases/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pipeline-stats"] });
      setIsEditDialogOpen(false);
      toast({ title: "Sales case updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", `/api/sales-cases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pipeline-stats"] });
      toast({ title: "Sales case deleted" });
      navigate("/sales");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: (data: typeof newActivity) =>
      apiRequest("POST", `/api/sales-cases/${id}/activities`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases", id, "activities"] });
      setIsActivityDialogOpen(false);
      setNewActivity({ activityType: "meeting", subject: "", description: "", scheduledAt: "" });
      toast({ title: "Activity created" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create activity", description: error.message, variant: "destructive" });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ activityId, outcome }: { activityId: string; outcome: string }) =>
      apiRequest("PUT", `/api/sales-activities/${activityId}`, { 
        outcome, 
        completedAt: outcome === "completed" ? new Date().toISOString() : null 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases", id, "activities"] });
      toast({ title: "Activity updated" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: typeof newNote) =>
      apiRequest("POST", `/api/sales-cases/${id}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases", id, "notes"] });
      setIsNoteDialogOpen(false);
      setNewNote({ content: "", visibility: "internal" });
      toast({ title: "Note added" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add note", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || !salesCase) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading sales case...</p>
        </div>
      </Layout>
    );
  }

  const customer = customers.find((c) => c.id === salesCase.customerId);
  const currentStage = PIPELINE_STAGES.find((s) => s.id === salesCase.status);

  const formatCurrency = (value: string | undefined) => {
    if (!value) return "—";
    const num = parseFloat(value);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(num);
  };

  const handleEdit = () => {
    setEditForm({
      title: salesCase.title,
      customerId: salesCase.customerId,
      estimatedValue: salesCase.estimatedValue,
      expectedCloseDate: salesCase.expectedCloseDate,
      description: salesCase.description,
      status: salesCase.status,
      probability: salesCase.probability,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = (stage: typeof PIPELINE_STAGES[0]) => {
    updateMutation.mutate({ status: stage.id, probability: stage.probability });
  };

  return (
    <Layout
      title={salesCase.title}
      subtitle={salesCase.caseNumber}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/sales")} data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pipeline
          </Button>
          <Button variant="outline" onClick={handleEdit} data-testid="edit-sales-case-button">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate()} data-testid="delete-sales-case-button">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Status Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {PIPELINE_STAGES.slice(0, 4).map((stage, index) => (
                  <div key={stage.id} className="flex items-center">
                    <button
                      onClick={() => handleUpdateStatus(stage)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        salesCase.status === stage.id
                          ? `${stage.color} text-white`
                          : PIPELINE_STAGES.findIndex((s) => s.id === salesCase.status) > index
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      data-testid={`stage-button-${stage.id}`}
                    >
                      {PIPELINE_STAGES.findIndex((s) => s.id === salesCase.status) > index ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Target className="w-4 h-4" />
                      )}
                      {stage.label}
                    </button>
                    {index < 3 && <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />}
                  </div>
                ))}
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant={salesCase.status === "won" ? "default" : "outline"}
                    className={salesCase.status === "won" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => handleUpdateStatus(PIPELINE_STAGES[4])}
                    data-testid="mark-won-button"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Won
                  </Button>
                  <Button
                    size="sm"
                    variant={salesCase.status === "lost" ? "destructive" : "outline"}
                    onClick={() => handleUpdateStatus(PIPELINE_STAGES[5])}
                    data-testid="mark-lost-button"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Lost
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Activities and Notes */}
          <Tabs defaultValue="activities">
            <TabsList>
              <TabsTrigger value="activities" data-testid="tab-activities">
                Activities ({activities.length})
              </TabsTrigger>
              <TabsTrigger value="notes" data-testid="tab-notes">
                Notes ({notes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Activities</CardTitle>
                  <Button size="sm" onClick={() => setIsActivityDialogOpen(true)} data-testid="add-activity-button">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Activity
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No activities yet. Add your first activity to track progress.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activities.map((activity) => {
                          const ActivityIcon = ACTIVITY_TYPES.find((t) => t.id === activity.activityType)?.icon || FileText;
                          return (
                            <div key={activity.id} className="flex gap-4 p-4 border rounded-lg">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                activity.outcome === "completed" ? "bg-green-100" : 
                                activity.outcome === "cancelled" ? "bg-red-100" : "bg-blue-100"
                              }`}>
                                <ActivityIcon className={`w-5 h-5 ${
                                  activity.outcome === "completed" ? "text-green-600" : 
                                  activity.outcome === "cancelled" ? "text-red-600" : "text-blue-600"
                                }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{activity.subject}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      activity.outcome === "completed" ? "default" :
                                      activity.outcome === "cancelled" ? "destructive" : "secondary"
                                    }>
                                      {activity.outcome}
                                    </Badge>
                                    {activity.outcome === "planned" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateActivityMutation.mutate({ 
                                          activityId: activity.id, 
                                          outcome: "completed" 
                                        })}
                                        data-testid={`complete-activity-${activity.id}`}
                                      >
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(activity.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {ACTIVITY_TYPES.find((t) => t.id === activity.activityType)?.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Notes</CardTitle>
                  <Button size="sm" onClick={() => setIsNoteDialogOpen(true)} data-testid="add-note-button">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Note
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No notes yet. Add a note to keep track of important information.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notes.map((note) => (
                          <div key={note.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={note.visibility === "internal" ? "secondary" : "outline"}>
                                {note.visibility === "internal" ? "Internal" : "Shared"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={`${currentStage?.color} text-white`}>
                  {currentStage?.label}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Value</span>
                <span className="font-semibold">{formatCurrency(salesCase.estimatedValue)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Probability</span>
                <span className="font-medium">{salesCase.probability}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Weighted Value</span>
                <span className="font-medium">
                  {formatCurrency((parseFloat(salesCase.estimatedValue || "0") * salesCase.probability / 100).toString())}
                </span>
              </div>
              
              {salesCase.expectedCloseDate && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expected Close</span>
                    <span className="font-medium">
                      {format(new Date(salesCase.expectedCloseDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {format(new Date(salesCase.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {format(new Date(salesCase.updatedAt), "MMM d, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      View Customer
                    </Button>
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {salesCase.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {salesCase.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sales Case</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                data-testid="edit-input-title"
              />
            </div>

            <div>
              <Label htmlFor="edit-customer">Customer</Label>
              <Select
                value={editForm.customerId || ""}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger data-testid="edit-select-customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-value">Estimated Value</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={editForm.estimatedValue || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, estimatedValue: e.target.value }))}
                  data-testid="edit-input-value"
                />
              </div>
              <div>
                <Label htmlFor="edit-probability">Probability %</Label>
                <Input
                  id="edit-probability"
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.probability || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                  data-testid="edit-input-probability"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-close-date">Expected Close Date</Label>
              <Input
                id="edit-close-date"
                type="date"
                value={editForm.expectedCloseDate ? editForm.expectedCloseDate.split("T")[0] : ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                data-testid="edit-input-close-date"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                data-testid="edit-input-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending} data-testid="save-edit-button">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity-type">Type</Label>
              <Select
                value={newActivity.activityType}
                onValueChange={(value) => setNewActivity((prev) => ({ ...prev, activityType: value }))}
              >
                <SelectTrigger data-testid="activity-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity-subject">Subject</Label>
              <Input
                id="activity-subject"
                value={newActivity.subject}
                onChange={(e) => setNewActivity((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Initial discovery call"
                data-testid="activity-subject-input"
              />
            </div>

            <div>
              <Label htmlFor="activity-scheduled">Scheduled Date & Time</Label>
              <Input
                id="activity-scheduled"
                type="datetime-local"
                value={newActivity.scheduledAt}
                onChange={(e) => setNewActivity((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                data-testid="activity-scheduled-input"
              />
            </div>

            <div>
              <Label htmlFor="activity-description">Description (optional)</Label>
              <Textarea
                id="activity-description"
                value={newActivity.description}
                onChange={(e) => setNewActivity((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                data-testid="activity-description-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createActivityMutation.mutate(newActivity)} 
              disabled={createActivityMutation.isPending || !newActivity.subject || !newActivity.scheduledAt}
              data-testid="submit-activity-button"
            >
              {createActivityMutation.isPending ? "Adding..." : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="note-visibility">Visibility</Label>
              <Select
                value={newNote.visibility}
                onValueChange={(value) => setNewNote((prev) => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger data-testid="note-visibility-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal (Team only)</SelectItem>
                  <SelectItem value="shared">Shared (Customer visible)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="note-content">Note</Label>
              <Textarea
                id="note-content"
                value={newNote.content}
                onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Add your note here..."
                rows={5}
                data-testid="note-content-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createNoteMutation.mutate(newNote)} 
              disabled={createNoteMutation.isPending || !newNote.content}
              data-testid="submit-note-button"
            >
              {createNoteMutation.isPending ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
