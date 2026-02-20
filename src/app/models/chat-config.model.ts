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
  },
  Customer: {
    customerType: 'Customer',
    showMobileSearch: false,
    showDcoPanels: false,
    showChatGptIntegration: false,
    showResolvedButton: false,
    showWhatsappTemplate: false,
    showInitiateChat: false,
    inputType: 'none',
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
    chatListCustomerType: '9726724247',
    showChatListFilter: false,
    chatListDateFormat: 'shortTime',
    showChatListCustomerName: false,
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
    chatListCustomerType: '9586924247',
    showChatListFilter: false,
    chatListDateFormat: 'shortTime',
    showChatListCustomerName: false,
  },
};
