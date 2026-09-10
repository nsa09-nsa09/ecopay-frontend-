import type {
  AdminServiceReviewDto,
  AuthResponse,
  PaymentHistoryItemDto,
  PaymentIntentResponseDto,
  PublicHomeStatsDto,
  PublicServiceReviewDto,
  CreateRoomPayload,
  RoomPricingPreviewDto,
  RoomResponseDto,
  RoomSummaryDto,
  ServiceReviewDto,
} from './api';

type Expect<T extends true> = T;
type HasNoKey<T, K extends PropertyKey> = K extends keyof T ? false : true;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

type _AuthResponseDoesNotExposeRefreshToken = Expect<HasNoKey<AuthResponse, 'refreshToken'>>;
type _PaymentIntentHasSettlementCurrency = Expect<HasKey<PaymentIntentResponseDto, 'settlementCurrency'>>;
type _PaymentIntentHasPayableTotalKzt = Expect<HasKey<PaymentIntentResponseDto, 'payableTotalKzt'>>;
type _RoomHasShareKzt = Expect<HasKey<RoomResponseDto, 'shareKzt'>>;
type _RoomHasCommissionKzt = Expect<HasKey<RoomResponseDto, 'commissionKzt'>>;
type _RoomHasPayableTotalKzt = Expect<HasKey<RoomResponseDto, 'payableTotalKzt'>>;
type _RoomHasExistingMembersCount = Expect<HasKey<RoomResponseDto, 'existingMembersCount'>>;
type _RoomHasMarketplaceCapacity = Expect<HasKey<RoomResponseDto, 'marketplaceCapacity'>>;
type _RoomHasFilledSeats = Expect<HasKey<RoomResponseDto, 'filledSeats'>>;
type _RoomHasFreeSeats = Expect<HasKey<RoomResponseDto, 'freeSeats'>>;
type _RoomSummaryHasExistingMembersCount = Expect<HasKey<RoomSummaryDto, 'existingMembersCount'>>;
type _RoomSummaryHasMarketplaceCapacity = Expect<HasKey<RoomSummaryDto, 'marketplaceCapacity'>>;
type _RoomSummaryHasFilledSeats = Expect<HasKey<RoomSummaryDto, 'filledSeats'>>;
type _RoomSummaryHasFreeSeats = Expect<HasKey<RoomSummaryDto, 'freeSeats'>>;
type _CreateRoomPayloadHasExistingMembersCount = Expect<
  HasKey<CreateRoomPayload, 'existingMembersCount'>
>;
type _PricingPreviewHasPotentialOwnerPayout = Expect<
  HasKey<RoomPricingPreviewDto, 'potentialOwnerPayoutKzt'>
>;
type _PricingPreviewHasPotentialCommission = Expect<
  HasKey<RoomPricingPreviewDto, 'potentialEcoPayCommissionKzt'>
>;
type _HistoryCanCarrySettlementCurrency = Expect<HasKey<PaymentHistoryItemDto, 'settlementCurrency'>>;
type _PublicReviewHasHomepagePosition = Expect<HasKey<PublicServiceReviewDto, 'homepagePosition'>>;
type _UserReviewHasHomepagePosition = Expect<HasKey<ServiceReviewDto, 'homepagePosition'>>;
type _AdminReviewHasHomepagePosition = Expect<HasKey<AdminServiceReviewDto, 'homepagePosition'>>;
type _PublicReviewHasNoFeaturedOrder = Expect<HasNoKey<PublicServiceReviewDto, 'featuredOrder'>>;
type _HomeStatsHasCompletedOrActiveMemberships = Expect<
  HasKey<PublicHomeStatsDto, 'completedOrActiveMemberships'>
>;
type _HomeStatsHasActiveRooms = Expect<HasKey<PublicHomeStatsDto, 'activeRooms'>>;
type _HomeStatsHasNoActiveConnections = Expect<HasNoKey<PublicHomeStatsDto, 'activeConnections'>>;
type _HomeStatsHasNoCompletedConnections = Expect<
  HasNoKey<PublicHomeStatsDto, 'completedConnections'>
>;
