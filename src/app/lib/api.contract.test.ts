import type { AuthResponse, PaymentHistoryItemDto, PaymentIntentResponseDto, RoomResponseDto } from './api';

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
