-- Create liked_articles table
CREATE TABLE public.liked_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_title TEXT NOT NULL,
  article_link TEXT NOT NULL,
  article_source TEXT NOT NULL,
  article_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_articles table
CREATE TABLE public.saved_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_title TEXT NOT NULL,
  article_link TEXT NOT NULL,
  article_source TEXT NOT NULL,
  article_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_activity table
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.liked_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for liked_articles
CREATE POLICY "Users can view their own liked articles" 
ON public.liked_articles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own liked articles" 
ON public.liked_articles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liked articles" 
ON public.liked_articles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for saved_articles
CREATE POLICY "Users can view their own saved articles" 
ON public.saved_articles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved articles" 
ON public.saved_articles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved articles" 
ON public.saved_articles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_activity
CREATE POLICY "Users can view their own activity" 
ON public.user_activity 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity" 
ON public.user_activity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_liked_articles_user_id ON public.liked_articles(user_id);
CREATE INDEX idx_saved_articles_user_id ON public.saved_articles(user_id);
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_date ON public.user_activity(activity_date);