-- 국제 송금 정보를 포함한 은행 정보 스키마

-- profiles 테이블에 국제 송금 정보 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banking_info JSON;

-- banking_info JSON 구조 예시:
-- {
--   "domestic": {
--     "bankName": "국민은행",
--     "accountNumber": "123-456-789012",
--     "accountHolder": "홍길동"
--   },
--   "international": {
--     "englishName": "Hong Gil Dong",
--     "englishAddress": {
--       "street": "123 Gangnam-daero",
--       "city": "Seoul",
--       "state": "",
--       "postalCode": "06123",
--       "country": "South Korea"
--     },
--     "accountNumber": "123-456-789012",
--     "internationalCode": "CZNBKRSE",
--     "bankEnglishName": "KB Kookmin Bank",
--     "swiftCode": "CZNBKRSEXXX",
--     "branchCode": "001"
--   },
--   "shippingAddress": {
--     "recipientName": "홍길동",
--     "phoneNumber": "010-1234-5678",
--     "address": "서울시 강남구 강남대로 123",
--     "detailAddress": "101동 202호",
--     "postalCode": "06123",
--     "deliveryNote": "부재시 경비실에 맡겨주세요",
--     "imageUrl": null -- 주소 이미지 URL
--   }
-- }

-- business_profiles 테이블에도 은행 정보 추가
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS banking_info JSON,
ADD COLUMN IF NOT EXISTS tax_info JSON;

-- tax_info JSON 구조 예시:
-- {
--   "taxInvoiceEmail": "tax@company.com",
--   "businessType": "법인사업자",
--   "taxType": "일반과세자"
-- }

-- 인덱스 추가 (JSON 검색용)
CREATE INDEX IF NOT EXISTS idx_profiles_banking ON profiles USING GIN(banking_info);
CREATE INDEX IF NOT EXISTS idx_business_banking ON business_profiles USING GIN(banking_info);

-- 코멘트 추가
COMMENT ON COLUMN profiles.banking_info IS '국내 및 국제 송금 정보, 배송 주소 정보를 포함한 JSON';
COMMENT ON COLUMN business_profiles.banking_info IS '사업자 은행 정보 JSON';
COMMENT ON COLUMN business_profiles.tax_info IS '세금계산서 발행 정보 JSON';