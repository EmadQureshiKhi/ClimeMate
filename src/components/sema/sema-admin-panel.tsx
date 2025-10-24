'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSema } from './sema-context';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, CreditCard as Edit, Trash2, Building, Users, FileText, Database } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth/solana';
import { logCertificateOnChain } from '@/lib/solana-nft';
import CryptoJS from 'crypto-js';
import { BlockchainVerificationCard } from './blockchain-verification-card';

// If you have a SemaClient type, import it here
// import type { SemaClient } from '@/types/sema';

interface SemaAdminPanelProps {
  isOpenClientForm: boolean;
  setIsOpenClientForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SemaAdminPanel({
  isOpenClientForm,
  setIsOpenClientForm,
}: SemaAdminPanelProps) {
  const { toast } = useToast();
  const { clients, addClient, updateClient, deleteClient, reloadClients, activeClient } = useSema();
  const { wallets } = useWallets();

  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  
  // Blockchain logging state
  const [blockchainLogs, setBlockchainLogs] = useState<Array<{
    transactionSignature: string;
    action: string;
    dataHash: string;
    timestamp: string;
    status: 'pending' | 'success' | 'error';
    error?: string;
  }>>([]);
  const [isLoggingToBlockchain, setIsLoggingToBlockchain] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    size: 'Medium' as 'Small' | 'Medium' | 'Large' | 'Enterprise',
    status: 'active' as 'active' | 'inactive'
  });

  // Log action to Solana blockchain
  const logToBlockchain = async (action: string, clientData: any) => {
    if (!wallets || wallets.length === 0) {
      console.warn('No wallet connected, skipping blockchain log');
      return;
    }

    // Don't log for demo clients
    if (clientData.status === 'demo') {
      return;
    }

    setIsLoggingToBlockchain(true);

    try {
      const wallet = wallets[0];
      
      // Create detailed audit log data
      const logData = {
        type: 'SEMA_AUDIT_LOG',
        version: '1.0',
        application: 'ClimeMate SEMA Tools',
        module: 'Client Management',
        action: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        details: {
          clientId: clientData.id,
          clientName: clientData.name,
          industry: clientData.industry,
          size: clientData.size,
          status: clientData.status,
        },
        timestamp: new Date().toISOString(),
        user: wallet.address,
      };
      
      const dataHash = CryptoJS.SHA256(JSON.stringify(logData)).toString();

      // Add pending log
      const pendingLog = {
        transactionSignature: '',
        action,
        dataHash,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
      };
      
      setBlockchainLogs(prev => [pendingLog, ...prev]);

      // Log to Solana
      const logResult = await logCertificateOnChain(
        wallet.address,
        logData,
        async (txData: any) => {
          const result = await wallet.signAndSendTransaction(txData);
          return result;
        }
      );

      if (logResult.success) {
        // Update log with success
        setBlockchainLogs(prev => 
          prev.map((log, index) => 
            index === 0 
              ? { ...log, transactionSignature: logResult.signature, status: 'success' as const }
              : log
          )
        );
      } else {
        // Update log with error
        setBlockchainLogs(prev => 
          prev.map((log, index) => 
            index === 0 
              ? { ...log, status: 'error' as const, error: logResult.error || 'Failed to log' }
              : log
          )
        );
      }
    } catch (error: any) {
      console.error('Failed to log to blockchain:', error);
      
      // Update log with error
      setBlockchainLogs(prev => 
        prev.map((log, index) => 
          index === 0 
            ? { ...log, status: 'error' as const, error: error.message || 'Unknown error' }
            : log
        )
      );
    } finally {
      setIsLoggingToBlockchain(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      industry: '',
      size: 'Medium',
      status: 'active'
    });
    setEditingClient(null);
    setIsOpenClientForm(false);
  };

  const handleEdit = (client: any) => {
    setFormData({
      name: client.name,
      description: client.description || '',
      industry: client.industry || '',
      size: client.size,
      status: client.status
    });
    setEditingClient(client);
    setIsOpenClientForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const action = editingClient ? 'client_updated' : 'client_added';
      
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        toast({
          title: "Client Updated",
          description: `${formData.name} has been updated successfully.`,
        });
        
        // Log to blockchain
        await logToBlockchain(action, {
          id: editingClient.id,
          name: formData.name,
          industry: formData.industry,
          size: formData.size,
        });
      } else {
        const newClient = await addClient(formData);
        toast({
          title: "Client Added",
          description: `${formData.name} has been added successfully.`,
        });
        
        // Log to blockchain
        await logToBlockchain(action, {
          id: newClient.id,
          name: formData.name,
          industry: formData.industry,
          size: formData.size,
        });
      }
      
      // Reload clients to refresh the list
      await reloadClients();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to save client. Error: ${JSON.stringify(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (client: any) => {
    if (client.status === 'demo') {
      toast({
        title: "Cannot Delete",
        description: "Demo client cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClient(clientToDelete.id);
      toast({
        title: "Client Deleted",
        description: `${clientToDelete.name} has been deleted.`,
      });
      
      // Log to blockchain
      await logToBlockchain('client_deleted', {
        id: clientToDelete.id,
        name: clientToDelete.name,
        industry: clientToDelete.industry,
        size: clientToDelete.size,
      });
      
      // Reload clients to refresh the list
      await reloadClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          {/* Add/Edit Form */}
          {isOpenClientForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </CardTitle>
                <CardDescription>
                  Manage SEMA client organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter organization name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g., Technology, Manufacturing"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Organization Size</Label>
                      <Select
                        value={formData.size}
                        onValueChange={(value: 'Small' | 'Medium' | 'Large' | 'Enterprise') =>
                          setFormData(prev => ({ ...prev, size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Small">Small (1-50 employees)</SelectItem>
                          <SelectItem value="Medium">Medium (51-250 employees)</SelectItem>
                          <SelectItem value="Large">Large (251-1000 employees)</SelectItem>
                          <SelectItem value="Enterprise">Enterprise (1000+ employees)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive') =>
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the organization"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Blockchain Verification */}
          <BlockchainVerificationCard 
            logs={blockchainLogs}
            isLogging={isLoggingToBlockchain}
            module="Client Management"
          />

          {/* Clients List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Organizations</CardTitle>
                  <CardDescription>
                    Manage SEMA client organizations and their settings
                  </CardDescription>
                </div>
                <Button onClick={() => setIsOpenClientForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No clients found. Add your first client to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => {
                    const isActiveClient = activeClient?.id === client.id;
                    return (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{client.name}</h4>
                          {client.status === 'demo' ? (
                            <Badge variant="outline">Demo</Badge>
                          ) : (
                            <Badge variant={isActiveClient ? 'default' : 'secondary'}>
                              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{client.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Industry: {client.industry}</span>
                          <span>Size: {client.size}</span>
                          <span>Created: {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(client)}
                          disabled={client.status === 'demo'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure global SEMA tool settings and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>External Materiality Threshold</Label>
                    <Input type="number" defaultValue="7" min="1" max="10" />
                    <p className="text-xs text-muted-foreground">
                      Topics scoring above this threshold are considered externally material
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Materiality Threshold</Label>
                    <Input type="number" defaultValue="10" min="1" max="25" />
                    <p className="text-xs text-muted-foreground">
                      Topics with significance above this threshold are considered internally material
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Confidence Level</Label>
                    <Select defaultValue="0.95">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.90">90%</SelectItem>
                        <SelectItem value="0.95">95%</SelectItem>
                        <SelectItem value="0.99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Margin of Error</Label>
                    <Select defaultValue="0.05">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.01">1%</SelectItem>
                        <SelectItem value="0.03">3%</SelectItem>
                        <SelectItem value="0.05">5%</SelectItem>
                        <SelectItem value="0.10">10%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user access and permissions (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  User management features will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates & Standards
              </CardTitle>
              <CardDescription>
                Manage questionnaire templates and industry standards (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Template management features will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{clientToDelete?.name}</strong>? 
              This action cannot be undone and will remove all associated data including stakeholders, 
              topics, and reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}