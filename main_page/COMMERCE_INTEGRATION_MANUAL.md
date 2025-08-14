# 🛍️ 커머스 통합 상세 매뉴얼

## 목차
1. [시작하기](#시작하기)
2. [데이터베이스 설계](#데이터베이스-설계)
3. [API 구현](#api-구현)
4. [프론트엔드 구현](#프론트엔드-구현)
5. [결제 시스템](#결제-시스템)
6. [재고 관리](#재고-관리)
7. [배송 시스템](#배송-시스템)
8. [리뷰 시스템](#리뷰-시스템)
9. [쿠폰 및 할인](#쿠폰-및-할인)
10. [분석 및 리포팅](#분석-및-리포팅)

## 시작하기

### 프로젝트 초기 설정

1. **의존성 설치**
```bash
pnpm install
```

2. **환경변수 설정**
```bash
cp .env.example .env.local
```

3. **데이터베이스 마이그레이션**
```bash
pnpm prisma generate
pnpm prisma db push
```

## 데이터베이스 설계

### 1. 상품 스키마

```prisma
// prisma/schema.prisma에 추가

model Product {
  id              String    @id @default(cuid())
  sku             String    @unique
  name            String
  nameTranslations Json?    // 다국어 지원
  slug            String    @unique
  description     String?   @db.Text
  descriptionTranslations Json?
  
  // 가격 정보
  price           Float
  compareAtPrice  Float?    // 할인 전 가격
  cost            Float?    // 원가
  
  // 카테고리
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  
  // 이미지
  thumbnail       String?
  images          String[]
  
  // 재고 관리
  trackInventory  Boolean   @default(true)
  stock           Int       @default(0)
  lowStockAlert   Int       @default(10)
  
  // SEO
  metaTitle       String?
  metaDescription String?
  metaKeywords    String[]
  
  // 상태
  status          ProductStatus @default(DRAFT)
  publishedAt     DateTime?
  
  // 속성
  weight          Float?
  dimensions      Json?     // {width, height, depth}
  
  // 관계
  variants        ProductVariant[]
  reviews         ProductReview[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  wishlistItems   WishlistItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([categoryId])
  @@index([status])
  @@index([slug])
  @@map("products")
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  OUT_OF_STOCK
}

model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  name        String   // e.g., "Size", "Color"
  value       String   // e.g., "Large", "Red"
  sku         String   @unique
  price       Float?   // 변형 가격 (null이면 기본 가격 사용)
  stock       Int      @default(0)
  image       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([productId, name, value])
  @@map("product_variants")
}
```

### 2. 장바구니 스키마

```prisma
model Cart {
  id          String     @id @default(cuid())
  userId      String?    // null이면 게스트 카트
  sessionId   String?    // 게스트용 세션 ID
  
  items       CartItem[]
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  expiresAt   DateTime?  // 게스트 카트 만료
  
  user        User?      @relation(fields: [userId], references: [id])
  
  @@unique([userId])
  @@index([sessionId])
  @@map("carts")
}

model CartItem {
  id          String   @id @default(cuid())
  cartId      String
  productId   String
  variantId   String?
  quantity    Int      @default(1)
  
  cart        Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  
  addedAt     DateTime @default(now())
  
  @@unique([cartId, productId, variantId])
  @@map("cart_items")
}
```

### 3. 주문 스키마

```prisma
model Order {
  id              String    @id @default(cuid())
  orderNumber     String    @unique
  userId          String
  
  // 금액
  subtotal        Float
  taxAmount       Float
  shippingAmount  Float
  discountAmount  Float
  totalAmount     Float
  
  // 상태
  status          OrderStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  
  // 배송 정보
  shippingAddress Json
  billingAddress  Json
  shippingMethod  String?
  trackingNumber  String?
  
  // 결제 정보
  paymentMethod   String?
  paymentId       String?
  
  // 관계
  items           OrderItem[]
  payments        Payment[]
  shipments       Shipment[]
  
  // 메타데이터
  notes           String?
  metadata        Json?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  paidAt          DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  
  user            User      @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([status])
  @@index([orderNumber])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  PROCESSING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  PARTIAL_REFUNDED
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  variantId   String?
  
  name        String   // 주문 시점의 상품명
  sku         String
  price       Float    // 주문 시점의 가격
  quantity    Int
  total       Float
  
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  
  @@map("order_items")
}
```

### 4. 배송 스키마

```prisma
model ShippingMethod {
  id          String   @id @default(cuid())
  name        String
  description String?
  provider    String   // e.g., "fedex", "ups", "korea_post"
  
  basePrice   Float
  perKgPrice  Float    @default(0)
  
  minDays     Int      // 최소 배송일
  maxDays     Int      // 최대 배송일
  
  countries   String[] // 배송 가능 국가
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("shipping_methods")
}

model Shipment {
  id              String   @id @default(cuid())
  orderId         String
  trackingNumber  String?
  carrier         String?
  status          ShipmentStatus @default(PENDING)
  
  shippedAt       DateTime?
  deliveredAt     DateTime?
  
  order           Order    @relation(fields: [orderId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("shipments")
}

enum ShipmentStatus {
  PENDING
  PROCESSING
  SHIPPED
  IN_TRANSIT
  DELIVERED
  RETURNED
}
```

## API 구현

### 1. 상품 API

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 필터링 파라미터
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 쿼리 조건 구성
    const where: any = {
      status: 'ACTIVE'
    };
    
    if (category) {
      where.categoryId = category;
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    // 전체 개수 조회
    const total = await prisma.product.count({ where });
    
    // 상품 조회
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        [sort]: order
      },
      skip: (page - 1) * limit,
      take: limit
    });
    
    // 평균 평점 계산
    const productsWithRating = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;
      
      return {
        ...product,
        averageRating: avgRating,
        reviewCount: product.reviews.length
      };
    });
    
    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 관리자 권한 체크
    // ... auth check ...
    
    const product = await prisma.product.create({
      data: {
        ...body,
        slug: generateSlug(body.name),
        status: 'DRAFT'
      }
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
```

### 2. 장바구니 API

```typescript
// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    const sessionId = request.cookies.get('cart_session')?.value;
    
    let cart;
    
    if (session?.userId) {
      // 로그인 사용자
      cart = await prisma.cart.findUnique({
        where: { userId: session.userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });
    } else if (sessionId) {
      // 게스트 사용자
      cart = await prisma.cart.findFirst({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });
    }
    
    if (!cart) {
      return NextResponse.json({ items: [], total: 0 });
    }
    
    // 총액 계산
    const total = cart.items.reduce((sum, item) => {
      const price = item.variant?.price || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    
    return NextResponse.json({
      ...cart,
      total
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;
    
    const session = await getSession(request);
    const sessionId = request.cookies.get('cart_session')?.value || generateSessionId();
    
    // 상품 확인
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product || product.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 400 }
      );
    }
    
    // 재고 확인
    if (product.trackInventory && product.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }
    
    // 카트 찾기 또는 생성
    let cart = session?.userId
      ? await prisma.cart.findUnique({ where: { userId: session.userId } })
      : await prisma.cart.findFirst({ where: { sessionId } });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session?.userId,
          sessionId: !session?.userId ? sessionId : undefined,
          expiresAt: !session?.userId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined
        }
      });
    }
    
    // 카트 아이템 추가 또는 업데이트
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId || null
        }
      }
    });
    
    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity
        }
      });
    }
    
    const response = NextResponse.json({ success: true });
    
    // 게스트의 경우 세션 쿠키 설정
    if (!session?.userId) {
      response.cookies.set('cart_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 // 30일
      });
    }
    
    return response;
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}
```

### 3. 주문 API

```typescript
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { shippingAddress, billingAddress, shippingMethodId } = body;
    
    // 카트 조회
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });
    
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }
    
    // 재고 확인
    for (const item of cart.items) {
      if (item.product.trackInventory) {
        const availableStock = item.variant?.stock || item.product.stock;
        if (availableStock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${item.product.name}` },
            { status: 400 }
          );
        }
      }
    }
    
    // 배송비 계산
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: { id: shippingMethodId }
    });
    
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.variant?.price || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    
    const taxAmount = subtotal * 0.1; // 10% 세금
    const shippingAmount = shippingMethod?.basePrice || 0;
    const totalAmount = subtotal + taxAmount + shippingAmount;
    
    // 주문 생성
    const order = await prisma.$transaction(async (tx) => {
      // 주문 생성
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.userId,
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount: 0,
          totalAmount,
          shippingAddress,
          billingAddress,
          shippingMethod: shippingMethod?.name,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.product.name,
              sku: item.variant?.sku || item.product.sku,
              price: item.variant?.price || item.product.price,
              quantity: item.quantity,
              total: (item.variant?.price || item.product.price) * item.quantity
            }))
          }
        }
      });
      
      // 재고 차감
      for (const item of cart.items) {
        if (item.product.trackInventory) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          }
        }
      }
      
      // 카트 비우기
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      
      return newOrder;
    });
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

function generateOrderNumber() {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
```

## 프론트엔드 구현

### 1. 상품 목록 컴포넌트

```typescript
// src/components/products/ProductGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import Pagination from '@/components/ui/Pagination';

export default function ProductGrid() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  useEffect(() => {
    fetchProducts();
  }, [searchParams]);
  
  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      params.set('page', pagination.page.toString());
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="flex gap-8">
      <aside className="w-64">
        <ProductFilters />
      </aside>
      
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>
    </div>
  );
}
```

### 2. 장바구니 컴포넌트

```typescript
// src/components/cart/CartDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import CartItem from './CartItem';
import Button from '@/components/ui/Button';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">장바구니</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {cart?.items?.length === 0 ? (
            <p className="text-center text-gray-500">장바구니가 비어있습니다</p>
          ) : (
            <div className="space-y-4">
              {cart?.items?.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>
        
        {cart?.items?.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">합계</span>
              <span className="font-bold text-xl">
                ₩{cart.total.toLocaleString()}
              </span>
            </div>
            
            <Button
              className="w-full"
              onClick={() => window.location.href = '/checkout'}
            >
              결제하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 결제 시스템

### Toss Payments 통합

```typescript
// src/lib/payments/toss.ts
import { loadTossPayments } from '@tosspayments/payment-sdk';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export async function initTossPayments() {
  return await loadTossPayments(clientKey);
}

export async function requestPayment({
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  successUrl,
  failUrl
}) {
  const tossPayments = await initTossPayments();
  
  return tossPayments.requestPayment('카드', {
    amount,
    orderId,
    orderName,
    customerName,
    customerEmail,
    successUrl,
    failUrl
  });
}
```

## 재고 관리

### 실시간 재고 업데이트

```typescript
// src/lib/inventory/stock-manager.ts
import prisma from '@/lib/prisma';
import { sendLowStockAlert } from '@/lib/notifications';

export async function checkLowStock(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  if (product && product.stock <= product.lowStockAlert) {
    await sendLowStockAlert(product);
  }
}

export async function reserveStock(items: CartItem[]) {
  // 재고 예약 로직
}

export async function releaseStock(items: CartItem[]) {
  // 재고 해제 로직
}
```

## 배송 시스템

### 배송료 계산

```typescript
// src/lib/shipping/calculator.ts
export function calculateShipping({
  weight,
  dimensions,
  destination,
  method
}) {
  // 배송료 계산 로직
  let basePrice = method.basePrice;
  let weightPrice = weight * method.perKgPrice;
  
  // 지역별 추가 요금
  const zoneMultiplier = getZoneMultiplier(destination);
  
  return (basePrice + weightPrice) * zoneMultiplier;
}
```

## 리뷰 시스템

```prisma
model ProductReview {
  id          String   @id @default(cuid())
  productId   String
  userId      String
  orderId     String?  // 구매 확인용
  
  rating      Int      // 1-5
  title       String?
  content     String   @db.Text
  
  images      String[]
  
  isVerified  Boolean  @default(false) // 구매 확인됨
  
  helpful     Int      @default(0)
  unhelpful   Int      @default(0)
  
  product     Product  @relation(fields: [productId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  order       Order?   @relation(fields: [orderId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([productId, userId, orderId])
  @@map("product_reviews")
}
```

## 쿠폰 및 할인

```prisma
model Coupon {
  id              String   @id @default(cuid())
  code            String   @unique
  description     String?
  
  type            CouponType // PERCENTAGE, FIXED_AMOUNT
  value           Float
  
  minOrderAmount  Float?
  maxDiscount     Float?   // 최대 할인 금액
  
  usageLimit      Int?     // 전체 사용 제한
  usageCount      Int      @default(0)
  userLimit       Int?     // 사용자당 제한
  
  validFrom       DateTime
  validUntil      DateTime
  
  isActive        Boolean  @default(true)
  
  appliedOrders   Order[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("coupons")
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}
```

## 분석 및 리포팅

### 판매 분석 대시보드

```typescript
// src/app/admin/analytics/page.tsx
export default async function AnalyticsPage() {
  const stats = await getAnalytics();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="총 매출"
        value={`₩${stats.totalRevenue.toLocaleString()}`}
        change={stats.revenueChange}
      />
      <StatCard
        title="주문 수"
        value={stats.totalOrders}
        change={stats.ordersChange}
      />
      <StatCard
        title="평균 주문 금액"
        value={`₩${stats.averageOrderValue.toLocaleString()}`}
        change={stats.aovChange}
      />
      <StatCard
        title="전환율"
        value={`${stats.conversionRate}%`}
        change={stats.conversionChange}
      />
    </div>
  );
}
```

## 보안 고려사항

1. **결제 보안**
   - PCI DSS 준수
   - 카드 정보 직접 저장 금지
   - HTTPS 필수

2. **재고 관리**
   - 동시성 제어 (트랜잭션)
   - 재고 예약 시스템

3. **사용자 데이터**
   - 개인정보 암호화
   - GDPR 준수

## 성능 최적화

1. **이미지 최적화**
   - Next.js Image 컴포넌트 사용
   - WebP 포맷 지원
   - 지연 로딩

2. **캐싱 전략**
   - Redis 캐싱
   - CDN 활용
   - 정적 생성 (ISR)

3. **데이터베이스 최적화**
   - 인덱스 최적화
   - 쿼리 최적화
   - 커넥션 풀링

## 테스트

```typescript
// __tests__/products.test.ts
describe('Product API', () => {
  it('should fetch products with filters', async () => {
    const response = await fetch('/api/products?category=electronics&minPrice=10000');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.products).toBeInstanceOf(Array);
  });
});
```

## 배포 체크리스트

- [ ] 환경변수 설정
- [ ] 데이터베이스 마이그레이션
- [ ] 결제 시스템 프로덕션 키
- [ ] SSL 인증서
- [ ] CDN 설정
- [ ] 모니터링 설정
- [ ] 백업 전략
- [ ] 로드 테스트

## 문제 해결

### 일반적인 문제들

1. **카트 동기화 문제**
   - 로그인 시 게스트 카트 병합
   - 세션 만료 처리

2. **재고 불일치**
   - 정기적인 재고 검증
   - 트랜잭션 격리 수준 조정

3. **결제 실패**
   - 재시도 로직
   - 부분 환불 처리

## 추가 리소스

- [Prisma 문서](https://www.prisma.io/docs)
- [Next.js 커머스](https://nextjs.org/commerce)
- [Toss Payments 문서](https://docs.tosspayments.com)
- [Vercel 배포 가이드](https://vercel.com/docs)