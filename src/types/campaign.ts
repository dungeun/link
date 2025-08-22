export interface Campaign {
  id: string;
  title: string;
  brand_name: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  platforms: string[];
  required_followers: number;
  location: string;
  view_count: number;
  applicant_count: number;
  image_url: string;
  tags: string[];
  status: string;
  created_at: string;
  start_date: string;
  end_date: string;
  requirements: string;
  application_deadline: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  level: number;
}
