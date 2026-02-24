import { QuickAction } from '../components/quick-actions-panel/quick-actions-panel.component';

/** Right panel tab keys */
export type RightPanelTabKey = 'profile' | 'rides' | 'context' | 'actions' | 'notes';

/**
 * Configuration interface for the unified conversation component.
 * Each stakeholder type (Partner/Customer/Vendor/SRDP) has a preset
 * that drives all behavioral differences via this config object.
 */
export interface ChatTypeConfig {
  customerType: 'Partner' | 'Customer' | 'Vendor' | 'SRDP';
  showMobileSearch: boolean;
  showDcoPanels: boolean;
  showChatGptIntegration: boolean;
  showResolvedButton: boolean;
  showWhatsappTemplate: boolean;
  showInitiateChat: boolean;
  inputType: 'textarea' | 'input' | 'none';
  chatTitleField: 'customer_name' | 'customer';
  mediaCheckField: 'media' | 'media_type';
  includeCustomerTypeInSendMessage: boolean;
  joinChatMessageType: 'agentNumber' | 'Agent';
  useLoadingDelay: boolean;
  dcoNameFallback: boolean;
  userMessageNgClass: 'equals_customer' | 'not_agent';
  chatListCustomerType: string;
  showChatListFilter: boolean;
  chatListDateFormat: string;
  showChatListCustomerName: boolean;

  // Right Panel Customization (per stakeholder)
  /** Which right panel tabs are visible and in what order */
  rightPanelTabs: RightPanelTabKey[];
  /** Default tab when a chat is opened */
  defaultRightPanelTab: RightPanelTabKey;
  /** Which quick actions are enabled */
  enabledQuickActions: QuickAction[];
  /** Whether to show the profile details grid (type, assigned exec, status, rating) */
  showProfileDetails: boolean;
  /** Whether to show the context section in the profile tab */
  showContextSection: boolean;
  /** Whether to show the assignment/reassign card in profile tab */
  showAssignmentCard: boolean;
}

export const CHAT_TYPE_CONFIGS: Record<string, ChatTypeConfig> = {
  Partner: {
    customerType: 'Partner',
    showMobileSearch: true,
    showDcoPanels: true,
    showChatGptIntegration: true,
    showResolvedButton: true,
    showWhatsappTemplate: true,
    showInitiateChat: true,
    inputType: 'textarea',
    chatTitleField: 'customer_name',
    mediaCheckField: 'media',
    includeCustomerTypeInSendMessage: false,
    joinChatMessageType: 'agentNumber',
    useLoadingDelay: true,
    dcoNameFallback: true,
    userMessageNgClass: 'equals_customer',
    chatListCustomerType: '',
    showChatListFilter: true,
    chatListDateFormat: 'HH:mm',
    showChatListCustomerName: true,
    // Right Panel — Partner gets all tabs & actions
    rightPanelTabs: ['profile', 'rides', 'context', 'actions', 'notes'],
    defaultRightPanelTab: 'profile',
    enabledQuickActions: ['send_template', 'reassign', 'resolve', 'send_resolved_template', 'manage_tags', 'pickup_drop_city'],
    showProfileDetails: true,
    showContextSection: true,
    showAssignmentCard: true,
  },
  Customer: {
    customerType: 'Customer',
    showMobileSearch: false,
    showDcoPanels: false,
    showChatGptIntegration: false,
    showResolvedButton: false,
    showWhatsappTemplate: false,
    showInitiateChat: false,
    inputType: 'textarea',
    chatTitleField: 'customer',
    mediaCheckField: 'media_type',
    includeCustomerTypeInSendMessage: true,
    joinChatMessageType: 'Agent',
    useLoadingDelay: false,
    dcoNameFallback: false,
    userMessageNgClass: 'equals_customer',
    chatListCustomerType: 'Customer',
    showChatListFilter: false,
    chatListDateFormat: 'shortTime',
    showChatListCustomerName: false,
    // Right Panel — Customer gets profile, context, actions, notes (no rides)
    rightPanelTabs: ['profile', 'context', 'actions', 'notes'],
    defaultRightPanelTab: 'profile',
    enabledQuickActions: ['reassign', 'manage_tags', 'send_template'],
    showProfileDetails: true,
    showContextSection: true,
    showAssignmentCard: true,
  },
  Vendor: {
    customerType: 'Vendor',
    showMobileSearch: true,
    showDcoPanels: false,
    showChatGptIntegration: false,
    showResolvedButton: true,
    showWhatsappTemplate: true,
    showInitiateChat: true,
    inputType: 'textarea',
    chatTitleField: 'customer_name',
    mediaCheckField: 'media',
    includeCustomerTypeInSendMessage: false,
    joinChatMessageType: 'Agent',
    useLoadingDelay: false,
    dcoNameFallback: false,
    userMessageNgClass: 'equals_customer',
    chatListCustomerType: 'Vendor',
    showChatListFilter: false,
    chatListDateFormat: 'shortTime',
    showChatListCustomerName: false,
    // Right Panel — Vendor gets profile, actions, notes (no rides/context)
    rightPanelTabs: ['profile', 'actions', 'notes'],
    defaultRightPanelTab: 'profile',
    enabledQuickActions: ['send_template', 'reassign', 'resolve', 'manage_tags'],
    showProfileDetails: true,
    showContextSection: false,
    showAssignmentCard: true,
  },
  SRDP: {
    customerType: 'SRDP',
    showMobileSearch: false,
    showDcoPanels: false,
    showChatGptIntegration: false,
    showResolvedButton: true,
    showWhatsappTemplate: true,
    showInitiateChat: false,
    inputType: 'input',
    chatTitleField: 'customer_name',
    mediaCheckField: 'media',
    includeCustomerTypeInSendMessage: false,
    joinChatMessageType: 'Agent',
    useLoadingDelay: false,
    dcoNameFallback: false,
    userMessageNgClass: 'not_agent',
    chatListCustomerType: 'SRDP',
    showChatListFilter: false,
    chatListDateFormat: 'shortTime',
    showChatListCustomerName: false,
    // Right Panel — SRDP gets profile, actions, notes (no rides/context)
    rightPanelTabs: ['profile', 'actions', 'notes'],
    defaultRightPanelTab: 'profile',
    enabledQuickActions: ['send_template', 'resolve', 'manage_tags'],
    showProfileDetails: true,
    showContextSection: false,
    showAssignmentCard: false,
  },
};
