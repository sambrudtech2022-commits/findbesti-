
-- Top earners: users with most coins
CREATE OR REPLACE FUNCTION public.get_leaderboard_earners(_time_filter TEXT DEFAULT 'all')
RETURNS TABLE(user_id UUID, display_name TEXT, avatar_url TEXT, score BIGINT, rank BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    p.user_id,
    COALESCE(p.display_name, 'User') as display_name,
    p.avatar_url,
    COALESCE(SUM(tc.coins_earned), 0)::BIGINT as score,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(tc.coins_earned), 0) DESC)::BIGINT as rank
  FROM profiles p
  LEFT JOIN task_completions tc ON tc.user_id = p.user_id
    AND (_time_filter = 'all' OR tc.completed_at >= now() - interval '7 days')
  WHERE p.is_blocked = false OR p.is_blocked IS NULL
  GROUP BY p.user_id, p.display_name, p.avatar_url
  ORDER BY score DESC
  LIMIT 50;
$$;

-- Top referrers: users with most referrals
CREATE OR REPLACE FUNCTION public.get_leaderboard_referrers(_time_filter TEXT DEFAULT 'all')
RETURNS TABLE(user_id UUID, display_name TEXT, avatar_url TEXT, score BIGINT, rank BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    p.user_id,
    COALESCE(p.display_name, 'User') as display_name,
    p.avatar_url,
    COUNT(r.id)::BIGINT as score,
    ROW_NUMBER() OVER (ORDER BY COUNT(r.id) DESC)::BIGINT as rank
  FROM profiles p
  LEFT JOIN referrals r ON r.referrer_id = p.user_id
    AND (_time_filter = 'all' OR r.created_at >= now() - interval '7 days')
  WHERE p.is_blocked = false OR p.is_blocked IS NULL
  GROUP BY p.user_id, p.display_name, p.avatar_url
  HAVING COUNT(r.id) > 0
  ORDER BY score DESC
  LIMIT 50;
$$;

-- Most popular: users with most followers
CREATE OR REPLACE FUNCTION public.get_leaderboard_popular(_time_filter TEXT DEFAULT 'all')
RETURNS TABLE(user_id UUID, display_name TEXT, avatar_url TEXT, score BIGINT, rank BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    p.user_id,
    COALESCE(p.display_name, 'User') as display_name,
    p.avatar_url,
    COALESCE(p.followers, 0)::BIGINT as score,
    ROW_NUMBER() OVER (ORDER BY COALESCE(p.followers, 0) DESC)::BIGINT as rank
  FROM profiles p
  WHERE (p.is_blocked = false OR p.is_blocked IS NULL)
  ORDER BY score DESC
  LIMIT 50;
$$;
