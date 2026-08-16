import type {
  AdminServiceReviewDto,
  AuthResponse,
  PaymentHistoryItemDto,
  PaymentIntentResponseDto,
  PublicHomeStatsDto,
  PublicServiceReviewDto,
  RoomResponseDto,
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
