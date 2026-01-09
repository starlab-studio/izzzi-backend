import { INotificationProvider } from "src/modules/notification/application/providers/notification.provider";
import { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { CognitoAdapter } from "src/modules/auth/infrastructure/factories/cognito.adapter";
import { IAuthStrategy, AuthIdentityName } from "src/modules/auth/domain/types";

export const createMockEmailProvider = (): INotificationProvider => ({
  send: jest.fn().mockResolvedValue(undefined),
});

export const createMockCognitoAdapter = (): IAuthStrategy => ({
  name: AuthIdentityName.AWS_COGNITO,
  signUp: jest.fn(),
  signIn: jest.fn(),
  confirmSignUp: jest.fn(),
  resendConfirmationCode: jest.fn(),
  forgotPassword: jest.fn(),
  confirmForgotPassword: jest.fn(),
  changePassword: jest.fn(),
  refreshToken: jest.fn(),
  deleteIdentity: jest.fn(),
});

export const createMockStripeSyncService = (): IStripeSyncService => ({
  syncPlanToStripe: jest.fn().mockResolvedValue("prod_test_123"),
  syncPricingTiersToStripe: jest.fn().mockResolvedValue(new Map()),
  getOrCreateCustomer: jest.fn().mockResolvedValue("cus_test_123"),
  createSubscription: jest.fn().mockResolvedValue({
    subscriptionId: "sub_test_123",
    clientSecret: null,
    status: "active",
  }),
  updateSubscriptionQuantity: jest.fn().mockResolvedValue({
    id: "sub_test_123",
    quantity: 10,
  } as any),
  createPaymentIntent: jest.fn().mockResolvedValue({
    paymentIntentId: "pi_test_123",
    clientSecret: "secret_test_123",
  }),
  getSubscription: jest.fn().mockResolvedValue(null),
  getInvoice: jest.fn().mockResolvedValue(null),
  getPaymentMethod: jest.fn().mockResolvedValue(null),
  getPrice: jest.fn().mockResolvedValue(null),
  createBillingPortalSession: jest.fn().mockResolvedValue("session_test_123"),
  constructWebhookEvent: jest.fn().mockReturnValue({}),
  previewQuantityChange: jest.fn().mockResolvedValue({
    amountDue: 0,
    currency: "eur",
    prorationAmount: 0,
  }),
});

