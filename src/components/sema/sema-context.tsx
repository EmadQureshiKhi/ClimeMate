'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';

// Export SemaModule type for use in other components
export type SemaModule =
  | 'dashboard'
  | 'stakeholders'
  | 'sample-size'
  | 'questionnaire'
  | 'internal-assessment'
  | 'materiality-matrix'
  | 'reporting'
  | 'admin';

// Demo client that's always available
const DEMO_CLIENT: SemaClient = {
  id: 'demo-client',
  name: 'Demo Organization',
  description: 'Complete SEMA demonstration with sample data',
  industry: 'Technology',
  size: 'Medium',
  status: 'demo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export interface SemaClient {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  status: 'active' | 'inactive' | 'demo';
  privacyMode?: boolean;
  authorizedAuditors?: string[];
  created_at: string;
  updated_at: string;
}

export interface SemaStakeholder {
  id: string;
  client_id: string;
  name: string;
  category: 'Internal' | 'External';
  stakeholder_type?: string;
  dependency_economic: number;
  dependency_social: number;
  dependency_environmental: number;
  influence_economic: number;
  influence_social: number;
  influence_environmental: number;
  total_score: number;
  normalized_score: number;
  influence_category: 'High' | 'Medium' | 'Low';
  is_priority: boolean;
  population_size: number;
  created_at: string;
  updated_at: string;
}

export interface SemaSampleParameters {
  id: string;
  client_id: string;
  confidence_level: number;
  margin_error: number;
  population_proportion: number;
  z_score: number;
  base_sample_size: number;
  created_at: string;
  updated_at: string;
}

export interface SemaMaterialTopic {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  category: 'Economic' | 'Environmental' | 'Social';
  gri_code?: string | null;
  average_score: number;
  response_count: number;
  is_material: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemaInternalTopic {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  category: 'Economic' | 'Environmental' | 'Social';
  severity: number;
  likelihood: number;
  significance: number;
  is_material: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemaQuestionnaireResponse {
  id: string;
  topic_id: string;
  stakeholder_type: string;
  respondent_name?: string;
  score: number;
  comments?: string;
  response_time: number;
  created_at: string;
}

export interface SemaReport {
  id: string;
  client_id: string;
  title: string;
  report_type: 'materiality_assessment' | 'stakeholder_engagement' | 'full_sema';
  material_topics: any[];
  gri_disclosures: Record<string, any>;
  process_summary: Record<string, any>;
  status: 'draft' | 'final' | 'published';
  generated_at: string;
  created_at: string;
  updated_at: string;
}


interface SemaContextType {
  // Client management
  clients: SemaClient[];
  activeClient: SemaClient | null;
  setActiveClient: (client: SemaClient | null) => void;
  addClient: (client: Omit<SemaClient, 'id' | 'created_at' | 'updated_at'>) => Promise<SemaClient>;
  updateClient: (id: string, updates: Partial<SemaClient>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Data management
  stakeholders: SemaStakeholder[];
  sampleParameters: SemaSampleParameters | null;
  materialTopics: SemaMaterialTopic[];
  internalTopics: SemaInternalTopic[];
  questionnaireResponses: SemaQuestionnaireResponse[];
  reports: SemaReport[];

  // Data operations
  refreshData: () => Promise<void>;
  reloadClients: () => Promise<void>;
  isLoading: boolean;

  // CRUD operations
  addStakeholder: (data: any) => Promise<void>;
  updateStakeholder: (id: string, updates: any) => Promise<void>;
  deleteStakeholder: (id: string) => Promise<void>;
  updateSampleParameters: (parameters: any) => Promise<void>;
  addMaterialTopic: (data: any) => Promise<void>;
  updateMaterialTopic: (id: string, updates: any) => Promise<void>;
  deleteMaterialTopic: (id: string) => Promise<void>;
  addInternalTopic: (data: any) => Promise<void>;
  updateInternalTopic: (id: string, updates: any) => Promise<void>;
  deleteInternalTopic: (id: string) => Promise<void>;

  // Navigation and form control
  setActiveSemaModule: (module: SemaModule) => void;
  setOpenAdminClientForm: (isOpen: boolean) => void;
}

const SemaContext = createContext<SemaContextType | undefined>(undefined);

interface SemaProviderProps {
  children: ReactNode;
  setActiveSemaModule: (module: SemaModule) => void;
  setOpenAdminClientForm: (isOpen: boolean) => void;
}

export function SemaProvider({
  children,
  setActiveSemaModule,
  setOpenAdminClientForm
}: SemaProviderProps) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [clients, setClients] = useState<SemaClient[]>([]);
  const [activeClient, setActiveClient] = useState<SemaClient | null>(null);
  const [stakeholders, setStakeholders] = useState<SemaStakeholder[]>([]);
  const [sampleParameters, setSampleParameters] = useState<SemaSampleParameters | null>(null);
  const [materialTopics, setMaterialTopics] = useState<SemaMaterialTopic[]>([]);
  const [internalTopics, setInternalTopics] = useState<SemaInternalTopic[]>([]);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<SemaQuestionnaireResponse[]>([]);
  const [reports, setReports] = useState<SemaReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Demo data for showcase
  const getDemoData = () => ({
    stakeholders: [
      {
        id: 'demo-stakeholder-1',
        client_id: 'demo-client',
        name: 'Employees',
        category: 'Internal' as const,
        stakeholder_type: 'Employees',
        dependency_economic: 5,
        dependency_social: 4,
        dependency_environmental: 3,
        influence_economic: 4,
        influence_social: 5,
        influence_environmental: 3,
        total_score: 24,
        normalized_score: 0.8,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-2',
        client_id: 'demo-client',
        name: 'Customers',
        category: 'External' as const,
        stakeholder_type: 'Customers',
        dependency_economic: 5,
        dependency_social: 3,
        dependency_environmental: 2,
        influence_economic: 5,
        influence_social: 4,
        influence_environmental: 2,
        total_score: 21,
        normalized_score: 0.7,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-3',
        client_id: 'demo-client',
        name: 'Investors',
        category: 'External' as const,
        stakeholder_type: 'Investors',
        dependency_economic: 5,
        dependency_social: 2,
        dependency_environmental: 3,
        influence_economic: 5,
        influence_social: 3,
        influence_environmental: 4,
        total_score: 22,
        normalized_score: 0.73,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-4',
        client_id: 'demo-client',
        name: 'Suppliers',
        category: 'External' as const,
        stakeholder_type: 'Suppliers',
        dependency_economic: 4,
        dependency_social: 3,
        dependency_environmental: 4,
        influence_economic: 3,
        influence_social: 2,
        influence_environmental: 4,
        total_score: 20,
        normalized_score: 0.67,
        influence_category: 'Medium' as const,
        is_priority: true,
        population_size: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-5',
        client_id: 'demo-client',
        name: 'Local Community',
        category: 'External' as const,
        stakeholder_type: 'Community',
        dependency_economic: 2,
        dependency_social: 4,
        dependency_environmental: 5,
        influence_economic: 3,
        influence_social: 4,
        influence_environmental: 5,
        total_score: 23,
        normalized_score: 0.77,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    sampleParameters: {
      id: 'demo-sample-params',
      client_id: 'demo-client',
      confidence_level: 0.95,
      margin_error: 0.05,
      population_proportion: 0.5,
      z_score: 1.96,
      base_sample_size: 384,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    materialTopics: [
      {
        id: 'demo-material-1',
        client_id: 'demo-client',
        name: 'GHG Emissions',
        description: 'Direct and indirect greenhouse gas emissions',
        category: 'Environmental' as const,
        gri_code: 'GRI 305',
        average_score: 8.5,
        response_count: 45,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-2',
        client_id: 'demo-client',
        name: 'Economic Performance',
        description: 'Financial performance and economic impact',
        category: 'Economic' as const,
        gri_code: 'GRI 201',
        average_score: 9.2,
        response_count: 50,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-3',
        client_id: 'demo-client',
        name: 'Employee Health & Safety',
        description: 'Occupational health and safety practices',
        category: 'Social' as const,
        gri_code: 'GRI 403',
        average_score: 8.8,
        response_count: 48,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-4',
        client_id: 'demo-client',
        name: 'Data Privacy',
        description: 'Customer data protection and privacy',
        category: 'Social' as const,
        gri_code: 'GRI 418',
        average_score: 7.9,
        response_count: 42,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-5',
        client_id: 'demo-client',
        name: 'Water Management',
        description: 'Water usage and conservation',
        category: 'Environmental' as const,
        gri_code: 'GRI 303',
        average_score: 6.5,
        response_count: 38,
        is_material: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-6',
        client_id: 'demo-client',
        name: 'Supply Chain Ethics',
        description: 'Ethical sourcing and supplier practices',
        category: 'Social' as const,
        gri_code: 'GRI 414',
        average_score: 7.2,
        response_count: 40,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-7',
        client_id: 'demo-client',
        name: 'Cybersecurity Threats',
        description: 'External stakeholder importance of cybersecurity threats and data breaches',
        category: 'Social' as const,
        gri_code: 'GRI 418',
        average_score: 8.0,
        response_count: 55,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-8',
        client_id: 'demo-client',
        name: 'Supply Chain Disruption',
        description: 'External stakeholder importance of supply chain resilience and continuity',
        category: 'Economic' as const,
        gri_code: 'GRI 204',
        average_score: 7.5,
        response_count: 50,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-9',
        client_id: 'demo-client',
        name: 'Renewable Energy Transition',
        description: 'Transitioning to renewable energy sources and reducing reliance on fossil fuels',
        category: 'Environmental' as const,
        gri_code: 'GRI 302',
        average_score: 8.0,
        response_count: 60,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-10',
        client_id: 'demo-client',
        name: 'Employee Well-being & Diversity',
        description: 'Importance of employee health, safety, well-being, and diversity & inclusion initiatives',
        category: 'Social' as const,
        gri_code: 'GRI 401',
        average_score: 7.5,
        response_count: 55,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-11',
        client_id: 'demo-client',
        name: 'Circular Economy Practices',
        description: 'Importance of adopting circular economy principles in product design and operations',
        category: 'Environmental' as const,
        gri_code: 'GRI 306',
        average_score: 7.0,
        response_count: 50,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-12',
        client_id: 'demo-client',
        name: 'Ethical AI Development',
        description: 'Importance of developing and deploying artificial intelligence ethically and responsibly',
        category: 'Social' as const,
        gri_code: null,
        average_score: 7.8,
        response_count: 48,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    internalTopics: [
      {
        id: 'demo-internal-1',
        client_id: 'demo-client',
        name: 'Regulatory Compliance',
        description: 'Risk of non-compliance with environmental regulations',
        category: 'Environmental' as const,
        severity: 4,
        likelihood: 3,
        significance: 12,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-2',
        client_id: 'demo-client',
        name: 'Talent Retention',
        description: 'Risk of losing key employees',
        category: 'Social' as const,
        severity: 3,
        likelihood: 4,
        significance: 12,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-3',
        client_id: 'demo-client',
        name: 'Supply Chain Disruption',
        description: 'Risk of supply chain interruptions',
        category: 'Economic' as const,
        severity: 4,
        likelihood: 4,
        significance: 16,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-4',
        client_id: 'demo-client',
        name: 'Cybersecurity Threats',
        description: 'Risk of data breaches and cyber attacks',
        category: 'Social' as const,
        severity: 5,
        likelihood: 3,
        significance: 15,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-5',
        client_id: 'demo-client',
        name: 'Climate Change Impact',
        description: 'Physical risks from climate change',
        category: 'Environmental' as const,
        severity: 3,
        likelihood: 3,
        significance: 9,
        is_material: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-6',
        client_id: 'demo-client',
        name: 'GHG Emissions',
        description: 'Internal business impact of greenhouse gas emissions',
        category: 'Environmental' as const,
        severity: 5,
        likelihood: 5,
        significance: 25,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-7',
        client_id: 'demo-client',
        name: 'Economic Performance',
        description: 'Internal business impact of financial performance and stability',
        category: 'Economic' as const,
        severity: 5,
        likelihood: 4,
        significance: 20,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-8',
        client_id: 'demo-client',
        name: 'Employee Health & Safety',
        description: 'Internal business impact of occupational health and safety practices',
        category: 'Social' as const,
        severity: 4,
        likelihood: 4,
        significance: 16,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-9',
        client_id: 'demo-client',
        name: 'Renewable Energy Transition',
        description: 'Internal impact of shifting to renewable energy, including costs and operational changes',
        category: 'Environmental' as const,
        severity: 4,
        likelihood: 5,
        significance: 20,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-10',
        client_id: 'demo-client',
        name: 'Employee Well-being & Diversity',
        description: 'Internal impact of employee morale, productivity, and talent retention due to well-being and diversity efforts',
        category: 'Social' as const,
        severity: 4,
        likelihood: 4,
        significance: 16,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-11',
        client_id: 'demo-client',
        name: 'Circular Economy Practices',
        description: 'Internal impact of implementing circular economy models, including resource efficiency and waste reduction',
        category: 'Environmental' as const,
        severity: 3,
        likelihood: 5,
        significance: 15,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-12',
        client_id: 'demo-client',
        name: 'Ethical AI Development',
        description: 'Internal impact of ethical considerations in AI development, including bias and transparency',
        category: 'Social' as const,
        severity: 5,
        likelihood: 3,
        significance: 15,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    questionnaireResponses: [
      {
        id: 'demo-response-1',
        topic_id: 'demo-material-1',
        stakeholder_type: 'Employees',
        respondent_name: 'John Smith',
        score: 9,
        comments: 'Very important for our future',
        response_time: 120,
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-response-2',
        topic_id: 'demo-material-1',
        stakeholder_type: 'Customers',
        respondent_name: 'Sarah Johnson',
        score: 8,
        comments: 'Critical for brand reputation',
        response_time: 95,
        created_at: new Date().toISOString(),
      },
    ],
    reports: [
      {
        id: 'demo-report-1',
        client_id: 'demo-client',
        title: 'Materiality Assessment Report 2024',
        report_type: 'materiality_assessment' as const,
        material_topics: [],
        gri_disclosures: {},
        process_summary: {},
        status: 'final' as const,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  });

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load data when active client changes
  useEffect(() => {
    if (activeClient) {
      if (activeClient.status === 'demo') {
        loadDemoData();
      } else {
        refreshData();
      }
    }
  }, [activeClient]);

  const loadClients = async () => {
    try {
      // Always include demo client
      const allClients = [DEMO_CLIENT];

      // Fetch real clients from API if user is authenticated
      if (user?.id) {
        const response = await fetch(`/api/sema/clients?userId=${user.id}`);
        if (response.ok) {
          const { clients: apiClients } = await response.json();
          allClients.push(...apiClients);
        }
      }

      setClients(allClients);
      if (!activeClient) {
        setActiveClient(DEMO_CLIENT);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([DEMO_CLIENT]);
      if (!activeClient) {
        setActiveClient(DEMO_CLIENT);
      }
    }
  };

  const loadDemoData = () => {
    const demoData = getDemoData();
    setStakeholders(demoData.stakeholders);
    setSampleParameters(demoData.sampleParameters);
    setMaterialTopics(demoData.materialTopics);
    setInternalTopics(demoData.internalTopics);
    setQuestionnaireResponses(demoData.questionnaireResponses);
    setReports(demoData.reports);
    setIsLoading(false);
  };

  // Expose loadClients for external use
  const reloadClients = loadClients;

  const addClient = async (clientData: Omit<SemaClient, 'id' | 'created_at' | 'updated_at'>): Promise<SemaClient> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Call API to create client
    const response = await fetch('/api/sema/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        ...clientData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create client');
    }

    const { client: newClient } = await response.json();

    // Convert API response to match SemaClient type
    const formattedClient: SemaClient = {
      id: newClient.id,
      name: newClient.name,
      description: newClient.description,
      industry: newClient.industry,
      size: newClient.size,
      status: newClient.status,
      privacyMode: newClient.privacyMode,
      authorizedAuditors: newClient.authorizedAuditors,
      created_at: newClient.createdAt,
      updated_at: newClient.updatedAt,
    };

    // Reload all clients to ensure consistency
    await loadClients();

    // Set the new client as active
    setActiveClient(formattedClient);

    return formattedClient;
  };

  const updateClient = async (id: string, updates: Partial<SemaClient>) => {
    // Don't allow updating demo client
    if (id === 'demo-client') {
      throw new Error('Cannot update demo client');
    }

    // Call API to update client
    const response = await fetch(`/api/sema/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update client');
    }

    const { client: updatedClient } = await response.json();

    // Convert API response
    const formattedClient: SemaClient = {
      id: updatedClient.id,
      name: updatedClient.name,
      description: updatedClient.description,
      industry: updatedClient.industry,
      size: updatedClient.size,
      status: updatedClient.status,
      created_at: updatedClient.createdAt,
      updated_at: updatedClient.updatedAt,
    };

    setClients(prev => prev.map(c => c.id === id ? formattedClient : c));
    if (activeClient?.id === id) {
      setActiveClient(formattedClient);
    }
  };

  const deleteClient = async (id: string) => {
    // Don't allow deleting demo client
    const client = clients.find(c => c.id === id);
    if (client?.status === 'demo') {
      throw new Error('Cannot delete demo client');
    }

    // Call API to delete client
    const response = await fetch(`/api/sema/clients/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete client');
    }

    setClients(prev => prev.filter(c => c.id !== id));
    if (activeClient?.id === id) {
      setActiveClient(DEMO_CLIENT);
    }
  };

  // Add stakeholder function with enhanced logging
  const addStakeholder = async (stakeholderData: any): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just add to local state
    if (activeClient.status === 'demo') {
      const newStakeholder = {
        id: `stakeholder-${Date.now()}`,
        ...stakeholderData,
        client_id: activeClient.id,
        total_score: (stakeholderData.dependency_economic + stakeholderData.dependency_social + stakeholderData.dependency_environmental +
          stakeholderData.influence_economic + stakeholderData.influence_social + stakeholderData.influence_environmental),
        normalized_score: 0.8,
        influence_category: 'High' as const,
        is_priority: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setStakeholders(prev => [...prev, newStakeholder]);
      return;
    }

    // Get wallet address for blockchain logging
    const walletAddress = wallets && wallets.length > 0 ? wallets[0].address : undefined;

    // For real clients, call the API
    const response = await fetch('/api/sema/stakeholders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: activeClient.id,
        walletAddress,
        ...stakeholderData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create stakeholder');
    }

    // Refresh data to get the new stakeholder
    await refreshData();
  };

  // Update stakeholder function
  const updateStakeholder = async (id: string, updates: any): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just update local state
    if (activeClient.status === 'demo') {
      setStakeholders(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      return;
    }

    // For real clients, call the API
    const response = await fetch(`/api/sema/stakeholders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update stakeholder');
    }

    // Refresh data to get the updated stakeholder
    await refreshData();
  };

  // Delete stakeholder function
  const deleteStakeholder = async (id: string): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just remove from local state
    if (activeClient.status === 'demo') {
      setStakeholders(prev => prev.filter(s => s.id !== id));
      return;
    }

    // For real clients, call the API
    const response = await fetch(`/api/sema/stakeholders/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete stakeholder');
    }

    // Refresh data to remove the deleted stakeholder
    await refreshData();
  };

  // Update sample parameters function
  const updateSampleParameters = async (parameters: any): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just update local state
    if (activeClient.status === 'demo') {
      const newParams = {
        id: sampleParameters?.id || `params-${Date.now()}`,
        client_id: activeClient.id,
        ...parameters,
        z_score: parameters.confidence_level === 0.90 ? 1.645 :
          parameters.confidence_level === 0.95 ? 1.96 : 2.576,
        base_sample_size: Math.ceil(
          Math.pow(parameters.confidence_level === 0.90 ? 1.645 :
            parameters.confidence_level === 0.95 ? 1.96 : 2.576, 2) *
          parameters.population_proportion * (1 - parameters.population_proportion) /
          Math.pow(parameters.margin_error, 2)
        ),
        created_at: sampleParameters?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSampleParameters(newParams);
      return;
    }

    // For real clients, call the API
    const response = await fetch('/api/sema/sample-parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: activeClient.id,
        ...parameters,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save sample parameters');
    }

    // Refresh data
    await refreshData();
  };

  // Add material topic function
  const addMaterialTopic = async (topicData: any): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just add to local state
    if (activeClient.status === 'demo') {
      const newTopic = {
        id: `topic-${Date.now()}`,
        ...topicData,
        client_id: activeClient.id,
        average_score: Math.random() * 3 + 7,
        response_count: Math.floor(Math.random() * 20) + 30,
        is_material: Math.random() > 0.3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMaterialTopics(prev => [...prev, newTopic]);
      return;
    }

    // Transform gri_code to griCode for Prisma
    const { gri_code, ...rest } = topicData;
    const transformedData = {
      ...rest,
      ...(gri_code && { griCode: gri_code }),
    };

    // For real clients, call the API
    const response = await fetch('/api/sema/material-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: activeClient.id,
        ...transformedData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create material topic');
    }

    await refreshData();
  };

  // Update material topic function
  const updateMaterialTopic = async (id: string, updates: any): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just update local state
    if (activeClient.status === 'demo') {
      setMaterialTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      return;
    }

    // Transform gri_code to griCode for Prisma
    const { gri_code, ...rest } = updates;
    const transformedUpdates = {
      ...rest,
      ...(gri_code !== undefined && { griCode: gri_code }),
    };

    // For real clients, call the API
    const response = await fetch(`/api/sema/material-topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedUpdates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update material topic');
    }

    await refreshData();
  };

  // Delete material topic function
  const deleteMaterialTopic = async (id: string): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just remove from local state
    if (activeClient.status === 'demo') {
      setMaterialTopics(prev => prev.filter(t => t.id !== id));
      return;
    }

    // For real clients, call the API
    const response = await fetch(`/api/sema/material-topics/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete material topic');
    }

    await refreshData();
  };

  // Add internal topic function
  const addInternalTopic = async (topicData: any): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just add to local state
    if (activeClient.status === 'demo') {
      const newTopic = {
        id: `internal-${Date.now()}`,
        ...topicData,
        client_id: activeClient.id,
        significance: topicData.severity * topicData.likelihood,
        is_material: (topicData.severity * topicData.likelihood) >= 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setInternalTopics(prev => [...prev, newTopic]);
      return;
    }

    // For real clients, call the API
    const response = await fetch('/api/sema/internal-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: activeClient.id,
        ...topicData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create internal topic');
    }

    await refreshData();
  };

  // Update internal topic function
  const updateInternalTopic = async (id: string, updates: any): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just update local state
    if (activeClient.status === 'demo') {
      const updatedData = {
        ...updates,
        significance: updates.severity * updates.likelihood,
        is_material: (updates.severity * updates.likelihood) >= 10,
        updated_at: new Date().toISOString()
      };
      setInternalTopics(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
      return;
    }

    // For real clients, call the API
    const response = await fetch(`/api/sema/internal-topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update internal topic');
    }

    await refreshData();
  };

  // Delete internal topic function
  const deleteInternalTopic = async (id: string): Promise<void> => {
    if (!activeClient) throw new Error('No active client');

    // For demo client, just remove from local state
    if (activeClient.status === 'demo') {
      setInternalTopics(prev => prev.filter(t => t.id !== id));
      return;
    }

    // For real clients, call the API
    const response = await fetch(`/api/sema/internal-topics/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete internal topic');
    }

    await refreshData();
  };

  const refreshData = async () => {
    if (!activeClient) return;

    setIsLoading(true);

    try {
      // Fetch stakeholders
      const stakeholdersResponse = await fetch(`/api/sema/stakeholders?clientId=${activeClient.id}`);
      if (stakeholdersResponse.ok) {
        const { stakeholders: apiStakeholders } = await stakeholdersResponse.json();
        const transformedStakeholders = (apiStakeholders || []).map((s: any) => ({
          id: s.id,
          client_id: s.clientId,
          name: s.name,
          category: s.category,
          stakeholder_type: s.stakeholderType,
          dependency_economic: s.dependencyEconomic,
          dependency_social: s.dependencySocial,
          dependency_environmental: s.dependencyEnvironmental,
          influence_economic: s.influenceEconomic,
          influence_social: s.influenceSocial,
          influence_environmental: s.influenceEnvironmental,
          total_score: s.totalScore,
          normalized_score: s.normalizedScore || 0,
          influence_category: s.influenceCategory,
          is_priority: s.isPriority,
          population_size: s.populationSize || 0,
          created_at: s.createdAt,
          updated_at: s.updatedAt,
        }));
        setStakeholders(transformedStakeholders);
      } else {
        setStakeholders([]);
      }

      // Fetch sample parameters
      const paramsResponse = await fetch(`/api/sema/sample-parameters?clientId=${activeClient.id}`);
      if (paramsResponse.ok) {
        const { parameters } = await paramsResponse.json();
        if (parameters) {
          setSampleParameters({
            id: parameters.id,
            client_id: parameters.clientId,
            confidence_level: parameters.confidenceLevel,
            margin_error: parameters.marginError,
            population_proportion: parameters.populationProportion,
            z_score: parameters.zScore,
            base_sample_size: parameters.baseSampleSize,
            created_at: parameters.createdAt,
            updated_at: parameters.updatedAt,
          });
        } else {
          setSampleParameters(null);
        }
      } else {
        setSampleParameters(null);
      }

      // Fetch material topics
      const materialResponse = await fetch(`/api/sema/material-topics?clientId=${activeClient.id}`);
      if (materialResponse.ok) {
        const { topics } = await materialResponse.json();
        const transformedTopics = (topics || []).map((t: any) => ({
          id: t.id,
          client_id: t.clientId,
          name: t.name,
          description: t.description,
          category: t.category,
          gri_code: t.griCode,
          average_score: t.averageScore,
          response_count: t.responseCount,
          is_material: t.isMaterial,
          created_at: t.createdAt,
          updated_at: t.updatedAt,
        }));
        setMaterialTopics(transformedTopics);
      } else {
        setMaterialTopics([]);
      }

      // Fetch internal topics
      const internalResponse = await fetch(`/api/sema/internal-topics?clientId=${activeClient.id}`);
      if (internalResponse.ok) {
        const { topics } = await internalResponse.json();
        const transformedTopics = (topics || []).map((t: any) => ({
          id: t.id,
          client_id: t.clientId,
          name: t.name,
          description: t.description,
          category: t.category,
          severity: t.severity,
          likelihood: t.likelihood,
          significance: t.significance,
          is_material: t.isMaterial,
          created_at: t.createdAt,
          updated_at: t.updatedAt,
        }));
        setInternalTopics(transformedTopics);
      } else {
        setInternalTopics([]);
      }

      // Fetch reports
      const reportsResponse = await fetch(`/api/sema/reports?clientId=${activeClient.id}`);
      if (reportsResponse.ok) {
        const { reports } = await reportsResponse.json();
        const transformedReports = (reports || []).map((r: any) => ({
          id: r.id,
          client_id: r.clientId,
          title: r.title,
          report_type: r.reportType,
          material_topics: r.materialTopics,
          gri_disclosures: r.griDisclosures,
          process_summary: r.processSummary,
          status: r.status,
          generated_at: r.generatedAt,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        }));
        setReports(transformedReports);
      } else {
        setReports([]);
      }

      // Clear questionnaire responses for now (will be loaded per topic)
      setQuestionnaireResponses([]);

    } catch (error) {
      console.error('Error refreshing data:', error);
      // Clear data on error
      setStakeholders([]);
      setSampleParameters(null);
      setMaterialTopics([]);
      setInternalTopics([]);
      setQuestionnaireResponses([]);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SemaContext.Provider value={{
      clients,
      activeClient,
      setActiveClient,
      addClient,
      updateClient,
      deleteClient,
      stakeholders,
      sampleParameters,
      materialTopics,
      internalTopics,
      questionnaireResponses,
      reports,
      refreshData,
      reloadClients,
      isLoading,
      addStakeholder,
      updateStakeholder,
      deleteStakeholder,
      updateSampleParameters,
      addMaterialTopic,
      updateMaterialTopic,
      deleteMaterialTopic,
      addInternalTopic,
      updateInternalTopic,
      deleteInternalTopic,
      setActiveSemaModule,
      setOpenAdminClientForm
    }}>
      {children}
    </SemaContext.Provider>
  );
}

export function useSema() {
  const context = useContext(SemaContext);
  if (context === undefined) {
    throw new Error('useSema must be used within a SemaProvider');
  }
  return context;
}