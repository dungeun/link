-- 게시판 테이블 생성
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'community',
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  visibility VARCHAR(20) DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'MEMBERS_ONLY')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게시물 테이블 생성
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'DRAFT', 'HIDDEN')),
  view_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  meta_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'VISIBLE' CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id),
  UNIQUE(comment_id, user_id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- 첨부파일 테이블 생성
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- 인덱스 생성
CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_attachments_post_id ON attachments(post_id);

-- 기본 게시판 생성
INSERT INTO boards (name, description, category, status, visibility, settings) VALUES
  ('공지사항', '플랫폼 공지사항 게시판', 'notice', 'ACTIVE', 'PUBLIC', 
   '{"allowComments": false, "allowLikes": false, "requireApproval": false}'),
  ('FAQ', '자주 묻는 질문', 'faq', 'ACTIVE', 'PUBLIC',
   '{"allowComments": false, "allowLikes": false, "requireApproval": false}'),
  ('커뮤니티', '자유로운 소통 공간', 'community', 'ACTIVE', 'PUBLIC',
   '{"allowComments": true, "allowLikes": true, "requireApproval": false}'),
  ('캠페인 리뷰', '캠페인 참여 후기', 'review', 'ACTIVE', 'PUBLIC',
   '{"allowComments": true, "allowLikes": true, "requireApproval": false}'),
  ('이벤트', '진행중인 이벤트', 'event', 'ACTIVE', 'PUBLIC',
   '{"allowComments": true, "allowLikes": true, "requireApproval": false}')
ON CONFLICT DO NOTHING;