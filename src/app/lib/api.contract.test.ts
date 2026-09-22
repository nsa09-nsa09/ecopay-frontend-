import type {
  AdminServiceReviewDto,
  AuthResponse,
  PaymentHistoryItemDto,
  PaymentIntentResponseDto,
  PublicHomeStatsDto,
  PublicServiceReviewDto,
  CreateRoomPayload,
  MemberHoldDto,
  RoomMemberDto,
  RoomPricingPreviewDto,
  RoomResponseDto,
  RoomSettingsDto,
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
type _RoomHasOwnerPublicId = Expect<HasKey<RoomResponseDto, 'ownerPublicId'>>;
type _RoomHasOwnerRating = Expect<HasKey<RoomResponseDto, 'ownerRating'>>;
type _RoomMemberHasPublicId = Expect<HasKey<RoomMemberDto, 'userPublicId'>>;
type _RoomMemberHasSlugFallback = Expect<HasKey<RoomMemberDto, 'userSlug'>>;
type _RoomSettingsHasMinimum = Expect<HasKey<RoomSettingsDto, 'minimumRoomMembers'>>;
type _HoldHasAmount = Expect<HasKey<MemberHoldDto, 'heldAmount'>>;
type _HoldHasBeneficiaryPublicId = Expect<HasKey<MemberHoldDto, 'beneficiaryPublicId'>>;
type _HoldHasReleaseDate = Expect<HasKey<MemberHoldDto, 'nextReleaseAt'>>;
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
