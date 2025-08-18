-- Clear existing demo accounts
DELETE FROM "users" WHERE 
  email LIKE '%@demo.com' OR 
  email LIKE '%@example.com' OR 
  email LIKE '%@company.com' OR 
  email LIKE '%@linkpick.co.kr' OR
  type IN ('ADMIN', 'BUSINESS', 'INFLUENCER');